const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, '../server/db.sqlite'));

const appId = process.argv[2];

if (!appId) {
    console.error('App ID not provided');
    process.exit(1);
}

const main = async () => {
    db.get('SELECT * FROM apps WHERE id = ?', [appId], async (err, app) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        if (!app) {
            console.error('App not found');
            process.exit(1);
        }

        const { app_name, package_name, app_url, icon_path } = app;
        const projectPath = path.join(__dirname, 'builds', app_name);

        try {
            // 1. Create Flutter project
            console.log(`Creating Flutter project for ${app_name}...`);
            await execute(`flutter create --org ${package_name.split('.').slice(0, 2).join('.')} ${projectPath}`);

            // 2. Replace app icon
            console.log('Replacing app icon...');
            const iconSource = path.join(__dirname, '../server', icon_path);
            const iconDest = path.join(projectPath, 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png');
            await fs.copy(iconSource, iconDest);

            // 3. Modify main.dart
            console.log('Modifying main.dart...');
            const mainDartPath = path.join(projectPath, 'lib/main.dart');
            const mainDartContent = `
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${app_name}',
      home: Scaffold(
        body: SafeArea(
          child: WebView(
            initialUrl: '${app_url}',
            javascriptMode: JavascriptMode.unrestricted,
          ),
        ),
      ),
    );
  }
}
`;
            await fs.writeFile(mainDartPath, mainDartContent);

            // Add webview_flutter dependency
            await execute(`cd ${projectPath} && flutter pub add webview_flutter`);


            // 4. Build APK and AAB
            console.log('Building APK...');
            await execute(`cd ${projectPath} && flutter build apk --release`);
            const apkPath = path.join(projectPath, `build/app/outputs/flutter-apk/app-release.apk`);

            console.log('Building AAB...');
            await execute(`cd ${projectPath} && flutter build appbundle --release`);
            const aabPath = path.join(projectPath, `build/app/outputs/bundle/release/app-release.aab`);

            // 5. Update database
            console.log('Updating database...');
            db.run(
                'UPDATE apps SET status = ?, apk_path = ?, aab_path = ? WHERE id = ?',
                ['completed', apkPath, aabPath, appId],
                (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('App built successfully!');
                    }
                }
            );

        } catch (error) {
            console.error('Error building app:', error);
            db.run('UPDATE apps SET status = ? WHERE id = ?', ['failed', appId]);
        }
    });
};

const execute = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${command}`);
                console.error(stderr);
                reject(error);
            } else {
                console.log(stdout);
                resolve();
            }
        });
    });
};


main();
