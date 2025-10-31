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
   * 自动读取源版本：以 package.json 的 version 为准
   */
  getSourceVersion() {
    const pkgPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      console.error('未找到 package.json，无法自动同步版本');
      return null;
    }
    const data = this.readJsonFile(pkgPath);
    const versionRaw = data && data.version;
    const version = typeof versionRaw === 'string' ? versionRaw.trim() : versionRaw;
    if (!version) {
      console.error('package.json 未包含 version 字段');
      return null;
    }
    if (!this.isValidVersion(version)) {
      console.error(`package.json 的 version 不符合语义化规范: ${version}`);
      return null;
    }
    return version;
  }

  bumpVersion(version, type = 'patch') {
    const v = (version || '').trim();
    const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-[\w\.-]+)?(?:\+[\w\.-]+)?$/);
    if (!m) return null;
    let major = parseInt(m[1], 10);
    let minor = parseInt(m[2], 10);
    let patch = parseInt(m[3], 10);
    switch (String(type)) {
      case 'major':
        major += 1; minor = 0; patch = 0; break;
      case 'minor':
        minor += 1; patch = 0; break;
      default:
        patch += 1;
    }
    const next = `${major}.${minor}.${patch}`;
    // 保险：若计算结果与原值一致，则强制 +1 patch
    if (next === v) {
      const forced = `${major}.${minor}.${patch + 1}`;
      return forced;
    }
    return next;
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
    console.log(`\n🔧 版本同步工具\n`);
    console.log('用法:');
    console.log('  node sync-version.cjs [命令] [版本号]\n');
    console.log('命令:');
    console.log('  show, status, s     显示当前版本状态');
    console.log('  sync [版本号]       同步到指定版本；若省略版本号，将自动以 package.json 的 version 为准');
    console.log('  auto                自动递增并同步（默认 patch），可通过环境变量 BUMP=major/minor/patch 指定');
    console.log('  help, h            显示帮助信息\n');
    console.log('示例:');
    console.log('  node sync-version.cjs              # 自动递增 patch 并同步');
    console.log('  BUMP=minor node sync-version.cjs   # 自动递增 minor 并同步');
    console.log('  node sync-version.cjs show');
    console.log('  node sync-version.cjs sync 1.2.0');
    console.log('  node sync-version.cjs sync 2.0.0-beta.1');
  }
}

// 主程序入口
function main() {
  const syncer = new VersionSyncer();
  const args = process.argv.slice(2);

  // 无参数：自动递增（默认 patch）并同步
  if (args.length === 0) {
    const src = syncer.getSourceVersion();
    const bumpType = process.env.BUMP || 'patch';
    const next = src && syncer.bumpVersion(src, bumpType);
    console.log(`\n📦 源版本: ${src}  |  递增类型: ${bumpType}  |  目标版本: ${next}`);
    if (next) {
      syncer.syncToVersion(next);
    } else {
      syncer.showCurrentVersions();
    }
    return;
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case 'show':
    case 'status':
    case 's':
      syncer.showCurrentVersions();
      break;

    case 'sync': {
      const target = args[1] || syncer.getSourceVersion();
      if (!target) {
        console.error('❌ 无法确定目标版本');
        syncer.showHelp();
        process.exit(1);
      }
      syncer.syncToVersion(target);
      break;
    }

    case 'auto': {
      const src = syncer.getSourceVersion();
      const bumpType = process.env.BUMP || 'patch';
      const next = src && syncer.bumpVersion(src, bumpType);
      console.log(`\n📦 源版本: ${src}  |  递增类型: ${bumpType}  |  目标版本: ${next}`);
      if (!next) {
        console.error('❌ 自动同步失败：无法计算下一个版本');
        process.exit(1);
      }
      syncer.syncToVersion(next);
      break;
    }

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