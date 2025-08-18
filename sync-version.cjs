#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 版本同步脚本
 * 用于同步项目中多个配置文件的版本号
 */
class VersionSyncer {
  constructor() {
    this.projectRoot = process.cwd();
    this.configFiles = [
      {
        name: 'package.json',
        path: 'package.json',
        type: 'json',
        versionPath: 'version'
      },
      {
        name: 'tauri.conf.json',
        path: 'src-tauri/tauri.conf.json',
        type: 'json',
        versionPath: 'version'
      },
      {
        name: 'Cargo.toml',
        path: 'src-tauri/Cargo.toml',
        type: 'toml',
        versionPath: 'package.version'
      }
    ];
  }

  /**
   * 读取 JSON 文件
   */
  readJsonFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`读取 JSON 文件失败: ${filePath}`, error.message);
      return null;
    }
  }

  /**
   * 写入 JSON 文件
   */
  writeJsonFile(filePath, data) {
    try {
      const content = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    } catch (error) {
      console.error(`写入 JSON 文件失败: ${filePath}`, error.message);
      return false;
    }
  }

  /**
   * 读取 TOML 文件（简单解析）
   */
  readTomlFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error(`读取 TOML 文件失败: ${filePath}`, error.message);
      return null;
    }
  }

  /**
   * 写入 TOML 文件（简单替换）
   */
  writeTomlFile(filePath, content) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    } catch (error) {
      console.error(`写入 TOML 文件失败: ${filePath}`, error.message);
      return false;
    }
  }

  /**
   * 更新 TOML 文件中的版本号
   */
  updateTomlVersion(content, newVersion) {
    // 匹配 [package] 部分的 version 字段
    const versionRegex = /(\[package\][\s\S]*?version\s*=\s*")[^"]*(")/ ;
    return content.replace(versionRegex, `$1${newVersion}$2`);
  }

  /**
   * 验证版本号格式
   */
  isValidVersion(version) {
    const semverRegex = /^\d+\.\d+\.\d+(-[\w\.-]+)?(\+[\w\.-]+)?$/;
    return semverRegex.test(version);
  }

  /**
   * 获取当前所有文件的版本号
   */
  getCurrentVersions() {
    const versions = {};
    
    this.configFiles.forEach(config => {
      const fullPath = path.join(this.projectRoot, config.path);
      
      if (!fs.existsSync(fullPath)) {
        console.warn(`文件不存在: ${config.path}`);
        return;
      }

      if (config.type === 'json') {
        const data = this.readJsonFile(fullPath);
        if (data && data.version) {
          versions[config.name] = data.version;
        }
      } else if (config.type === 'toml') {
        const content = this.readTomlFile(fullPath);
        if (content) {
          const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
          if (versionMatch) {
            versions[config.name] = versionMatch[1];
          }
        }
      }
    });

    return versions;
  }

  /**
   * 同步版本号到指定版本
   */
  syncToVersion(targetVersion) {
    if (!this.isValidVersion(targetVersion)) {
      console.error(`无效的版本号格式: ${targetVersion}`);
      console.log('版本号应符合语义化版本规范，如: 1.0.0, 2.1.3-beta.1');
      return false;
    }

    console.log(`\n🔄 开始同步版本号到: ${targetVersion}`);
    console.log('=' .repeat(50));

    let successCount = 0;
    let totalCount = 0;

    this.configFiles.forEach(config => {
      const fullPath = path.join(this.projectRoot, config.path);
      
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️  跳过不存在的文件: ${config.path}`);
        return;
      }

      totalCount++;
      console.log(`\n📝 更新 ${config.name}...`);

      if (config.type === 'json') {
        const data = this.readJsonFile(fullPath);
        if (data) {
          const oldVersion = data.version;
          data.version = targetVersion;
          
          if (this.writeJsonFile(fullPath, data)) {
            console.log(`   ✅ ${oldVersion} → ${targetVersion}`);
            successCount++;
          } else {
            console.log(`   ❌ 更新失败`);
          }
        }
      } else if (config.type === 'toml') {
        const content = this.readTomlFile(fullPath);
        if (content) {
          const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
          const oldVersion = versionMatch ? versionMatch[1] : '未知';
          
          const updatedContent = this.updateTomlVersion(content, targetVersion);
          
          if (this.writeTomlFile(fullPath, updatedContent)) {
            console.log(`   ✅ ${oldVersion} → ${targetVersion}`);
            successCount++;
          } else {
            console.log(`   ❌ 更新失败`);
          }
        }
      }
    });

    console.log('\n' + '=' .repeat(50));
    console.log(`🎉 同步完成: ${successCount}/${totalCount} 个文件更新成功`);
    
    return successCount === totalCount;
  }

  /**
   * 显示当前版本状态
   */
  showCurrentVersions() {
    console.log('\n📋 当前版本状态:');
    console.log('=' .repeat(30));
    
    const versions = this.getCurrentVersions();
    
    if (Object.keys(versions).length === 0) {
      console.log('❌ 未找到任何版本信息');
      return;
    }

    Object.entries(versions).forEach(([file, version]) => {
      console.log(`📄 ${file.padEnd(20)} ${version}`);
    });

    // 检查版本是否一致
    const uniqueVersions = [...new Set(Object.values(versions))];
    if (uniqueVersions.length === 1) {
      console.log(`\n✅ 所有文件版本一致: ${uniqueVersions[0]}`);
    } else {
      console.log(`\n⚠️  发现版本不一致，建议同步版本`);
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
🔧 版本同步工具
`);
    console.log('用法:');
    console.log('  node sync-version.js [命令] [版本号]\n');
    console.log('命令:');
    console.log('  show, status, s     显示当前版本状态');
    console.log('  sync [版本号]       同步到指定版本');
    console.log('  help, h            显示帮助信息\n');
    console.log('示例:');
    console.log('  node sync-version.js show');
    console.log('  node sync-version.js sync 1.2.0');
    console.log('  node sync-version.js sync 2.0.0-beta.1');
  }
}

// 主程序入口
function main() {
  const syncer = new VersionSyncer();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    syncer.showCurrentVersions();
    return;
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case 'show':
    case 'status':
    case 's':
      syncer.showCurrentVersions();
      break;
      
    case 'sync':
      if (args.length < 2) {
        console.error('❌ 请指定要同步的版本号');
        console.log('示例: node sync-version.js sync 1.2.0');
        process.exit(1);
      }
      syncer.syncToVersion(args[1]);
      break;
      
    case 'help':
    case 'h':
      syncer.showHelp();
      break;
      
    default:
      console.error(`❌ 未知命令: ${command}`);
      syncer.showHelp();
      process.exit(1);
  }
}

// 运行主程序
if (require.main === module) {
  main();
}

module.exports = VersionSyncer;