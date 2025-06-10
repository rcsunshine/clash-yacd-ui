#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * V2架构合规检查脚本 - 增强版
 * 检查文件扩展名、样式格式、组件规范、代码质量等
 */

const V2_DIR = path.join(__dirname, '../src/v2');
const ERRORS = [];
const WARNINGS = [];

// 颜色输出
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addError(message) {
  ERRORS.push(message);
  log(`❌ ERROR: ${message}`, 'red');
}

function addWarning(message) {
  WARNINGS.push(message);
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function addSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function addInfo(message) {
  log(`ℹ️  INFO: ${message}`, 'blue');
}

// 递归获取所有文件
function getAllFiles(dir, extension = null) {
  const files = [];
  
  function scanDir(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (!extension || item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return files;
}

// 检查目录结构规范
function checkDirectoryStructure() {
  log('\n📁 检查目录结构规范...', 'blue');
  
  const requiredDirs = [
    'components',
    'components/ui', 
    'components/layout',
    'pages',
    'hooks',
    'utils', 
    'types',
    'styles',
    'store',
    'api'
  ];
  
  const recommendedDirs = [
    'constants',
    'components/business',
    'components/icons'
  ];
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(V2_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      addError(`缺少必需目录: ${dir}`);
    } else {
      addSuccess(`目录结构检查通过: ${dir}`);
    }
  });
  
  recommendedDirs.forEach(dir => {
    const dirPath = path.join(V2_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      addWarning(`建议创建目录: ${dir}`);
    }
  });
  
  // 检查多余的文档文件
  const docFiles = getAllFiles(V2_DIR, '.md').filter(file => 
    !file.includes('/docs/') && path.basename(file) !== 'README.md'
  );
  
  if (docFiles.length > 5) {
    addWarning(`V2根目录有过多文档文件 (${docFiles.length}个)，建议移至docs目录`);
  }
}

// 检查文件扩展名规范
function checkFileExtensions() {
  log('\n🔍 检查文件扩展名规范...', 'blue');
  
  // 检查是否有.css文件（应该全部是.scss）
  const cssFiles = getAllFiles(path.join(V2_DIR, 'styles'), '.css');
  if (cssFiles.length > 0) {
    cssFiles.forEach(file => {
      addError(`V2项目中发现CSS文件: ${path.relative(V2_DIR, file)} (应该使用.scss格式)`);
    });
  } else {
    addSuccess('样式文件格式检查通过：没有发现.css文件');
  }
  
  // 检查组件文件扩展名
  const componentDirs = [
    path.join(V2_DIR, 'components'),
    path.join(V2_DIR, 'pages')
  ];
  
  componentDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const tsFiles = getAllFiles(dir, '.ts').filter(file => 
        !file.includes('types') && !file.includes('utils') && !file.includes('constants') &&
        !file.includes('index.ts')
      );
      
      tsFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('React') || content.includes('JSX') || content.includes('return (')) {
          addError(`React组件使用错误扩展名: ${path.relative(V2_DIR, file)} (应该使用.tsx)`);
        }
      });
    }
  });
  
  // 检查是否有不应该存在的文件格式
  const invalidFiles = getAllFiles(V2_DIR).filter(file => {
    const ext = path.extname(file);
    const allowedExts = ['.ts', '.tsx', '.scss', '.md', '.json'];
    return !allowedExts.includes(ext) && !file.includes('node_modules');
  });
  
  if (invalidFiles.length > 0) {
    invalidFiles.forEach(file => {
      addWarning(`发现非标准文件格式: ${path.relative(V2_DIR, file)}`);
    });
  }
}

// 检查样式架构
function checkStyleArchitecture() {
  log('\n🎨 检查样式架构规范...', 'blue');
  
  const requiredStyleFiles = [
    'globals.scss',
    'components.scss', 
    'utilities.scss',
    'pages.scss'
  ];
  
  const stylesDir = path.join(V2_DIR, 'styles');
  
  requiredStyleFiles.forEach(file => {
    const filePath = path.join(stylesDir, file);
    if (!fs.existsSync(filePath)) {
      addError(`缺少必需的样式文件: ${file}`);
    } else {
      addSuccess(`样式文件检查通过: ${file}`);
    }
  });
  
  // 检查globals.scss是否正确导入了其他样式文件
  const globalsPath = path.join(stylesDir, 'globals.scss');
  if (fs.existsSync(globalsPath)) {
    const globalsContent = fs.readFileSync(globalsPath, 'utf8');
    const expectedImports = [
      './components.scss',
      './utilities.scss',
      './pages.scss'
    ];
    
    expectedImports.forEach(importPath => {
      if (!globalsContent.includes(`@import '${importPath}'`)) {
        addError(`globals.scss缺少导入: @import '${importPath}'`);
      }
    });
    
    // 检查是否使用了SCSS变量
    if (!globalsContent.includes('$color-') || !globalsContent.includes('#{$')) {
      addWarning('globals.scss可能没有充分使用SCSS变量系统');
    }
  }
}

// 检查组件文件规范
function checkComponentStandards() {
  log('\n🧩 检查组件开发规范...', 'blue');
  
  const componentDirs = [
    path.join(V2_DIR, 'components'),
    path.join(V2_DIR, 'pages')
  ];
  
  componentDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const tsxFiles = getAllFiles(dir, '.tsx');
      
      tsxFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const fileName = path.basename(file, '.tsx');
        const relativePath = path.relative(V2_DIR, file);
        
        // 检查是否定义了Props接口
        if (!content.includes(`interface ${fileName}Props`) && 
            !content.includes(`type ${fileName}Props`) &&
            !content.includes('React.ButtonHTMLAttributes') &&
            !content.includes('extends React.')) {
          addWarning(`组件缺少Props接口定义: ${relativePath}`);
        }
        
        // 检查是否正确导出组件
        if (!content.includes(`export const ${fileName}`) && 
            !content.includes(`export default ${fileName}`) &&
            !content.includes('React.forwardRef')) {
          addWarning(`组件可能缺少正确的导出: ${relativePath}`);
        }
        
        // 检查是否使用了禁止的CSS变量语法
        if (content.includes('bg-[var(--color-') || content.includes('text-[var(--color-')) {
          addError(`组件中使用了禁止的CSS变量语法: ${relativePath}`);
        }
        
        // 检查是否使用了!important
        if (content.includes('!important') || content.includes('!flex') || content.includes('!w-')) {
          addError(`组件中使用了!important强制覆盖: ${relativePath}`);
        }
        
        // 检查import语句规范
        const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
        const hasReactImport = importLines.some(line => line.includes("from 'react'"));
        
        if (content.includes('React.') && !hasReactImport) {
          addWarning(`组件使用React但未正确导入: ${relativePath}`);
        }
        
        // 检查深层相对路径导入
        const deepImports = importLines.filter(line => 
          line.includes('../../../') || line.includes('../../../../')
        );
        if (deepImports.length > 0) {
          addWarning(`组件使用深层相对路径导入: ${relativePath}`);
        }
      });
    }
  });
}

// 检查代码质量
function checkCodeQuality() {
  log('\n🔧 检查代码质量...', 'blue');
  
  const allFiles = getAllFiles(V2_DIR, '.tsx').concat(getAllFiles(V2_DIR, '.ts'));
  
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(V2_DIR, file);
    
    // 检查console语句
    const consoleMatches = content.match(/console\.(log|warn|error|debug)/g);
    if (consoleMatches && consoleMatches.length > 0) {
      addWarning(`发现调试语句: ${relativePath} (${consoleMatches.length}个console语句)`);
    }
    
    // 检查TODO/FIXME标记
    const todoMatches = content.match(/(?:TODO|FIXME|BUG|HACK):/gi);
    if (todoMatches && todoMatches.length > 0) {
      addInfo(`发现待处理标记: ${relativePath} (${todoMatches.length}个)`);
    }
    
    // 检查过长的行
    const lines = content.split('\n');
    const longLines = lines.filter(line => line.length > 120);
    if (longLines.length > 0) {
      addWarning(`发现过长代码行: ${relativePath} (${longLines.length}行超过120字符)`);
    }
    
    // 检查未使用的导入
    const importLines = lines.filter(line => line.trim().startsWith('import'));
    const unusedImports = importLines.filter(line => {
      const match = line.match(/import\s+(?:{[^}]+}|\w+)/);
      if (match) {
        const importName = match[0].replace(/import\s+{?/, '').replace(/}?/, '').trim();
        if (importName && !content.includes(importName.split(',')[0].trim())) {
          return true;
        }
      }
      return false;
    });
    
    if (unusedImports.length > 0) {
      addWarning(`可能存在未使用的导入: ${relativePath}`);
    }
  });
}

// 检查barrel exports（统一导出）
function checkBarrelExports() {
  log('\n📦 检查统一导出文件...', 'blue');
  
  const uiIndexPath = path.join(V2_DIR, 'components/ui/index.ts');
  const typesIndexPath = path.join(V2_DIR, 'types/index.ts');
  const utilsIndexPath = path.join(V2_DIR, 'utils/index.ts');
  
  if (fs.existsSync(uiIndexPath)) {
    addSuccess('UI组件统一导出文件存在');
    
    const indexContent = fs.readFileSync(uiIndexPath, 'utf8');
    const uiFiles = getAllFiles(path.join(V2_DIR, 'components/ui'), '.tsx')
      .filter(file => !file.includes('index.ts'));
    
    const missingExports = uiFiles.filter(file => {
      const componentName = path.basename(file, '.tsx');
      return !indexContent.includes(componentName);
    });
    
    if (missingExports.length > 0) {
      addWarning(`UI组件未在index.ts中导出: ${missingExports.map(f => path.basename(f)).join(', ')}`);
    }
  } else {
    addWarning('建议创建UI组件统一导出文件: components/ui/index.ts');
  }
  
  // 检查其他目录的统一导出
  [
    { path: typesIndexPath, name: '类型定义' },
    { path: utilsIndexPath, name: '工具函数' }
  ].forEach(({ path: filePath, name }) => {
    if (!fs.existsSync(filePath)) {
      addWarning(`建议创建${name}统一导出文件: ${path.relative(V2_DIR, filePath)}`);
    }
  });
}

// 检查TypeScript配置
function checkTypeScriptConfig() {
  log('\n📝 检查TypeScript配置...', 'blue');
  
  const tsconfigPath = path.join(path.dirname(V2_DIR), 'tsconfig.json');
  
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // 检查路径别名
    if (!tsconfig.compilerOptions?.paths?.['@v2']) {
      addWarning('建议在tsconfig.json中添加@v2路径别名');
    }
    
    // 检查include是否包含V2目录
    const include = tsconfig.include || [];
    if (!include.some(pattern => pattern.includes('src/v2') || pattern.includes('./src'))) {
      addWarning('tsconfig.json的include可能没有正确包含V2目录');
    }
  }
  
  try {
    execSync('npx tsc --noEmit', { cwd: path.dirname(V2_DIR), stdio: 'pipe' });
    addSuccess('TypeScript类型检查通过');
  } catch (error) {
    addError('TypeScript类型检查失败，请运行 npm run type-check 查看详情');
  }
}

// 检查Vite配置
function checkViteConfig() {
  log('\n⚡ 检查Vite配置...', 'blue');
  
  const viteConfigPath = path.join(path.dirname(V2_DIR), 'vite.v2.config.ts');
  
  if (fs.existsSync(viteConfigPath)) {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    // 检查路径别名
    if (!viteConfig.includes('@v2') || !viteConfig.includes('/src/v2')) {
      addWarning('Vite配置可能缺少@v2路径别名');
    }
    
    // 检查端口配置
    if (!viteConfig.includes('port: 3002')) {
      addWarning('V2应该使用独立端口3002');
    }
    
    // 检查输出目录
    if (!viteConfig.includes('dist-v2')) {
      addWarning('V2应该使用独立输出目录dist-v2');
    }
    
    addSuccess('Vite V2配置文件存在');
  } else {
    addError('缺少V2 Vite配置文件: vite.v2.config.ts');
  }
}

// 检查依赖关系
function checkDependencies() {
  log('\n📦 检查依赖关系...', 'blue');
  
  const packageJsonPath = path.join(path.dirname(V2_DIR), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = ['react', 'react-dom', 'typescript'];
    const requiredDevDeps = ['@types/react', '@types/react-dom', 'tailwindcss', 'sass'];
    
    requiredDeps.forEach(dep => {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        addError(`缺少必需依赖: ${dep}`);
      }
    });
    
    requiredDevDeps.forEach(dep => {
      if (!packageJson.devDependencies || !packageJson.devDependencies[dep]) {
        addError(`缺少必需开发依赖: ${dep}`);
      }
    });
    
    // 检查scripts
    const scripts = packageJson.scripts || {};
    const requiredScripts = ['dev:v2', 'build:v2', 'check:v2'];
    
    requiredScripts.forEach(script => {
      if (!scripts[script]) {
        addError(`缺少必需脚本: ${script}`);
      }
    });
    
    if (packageJson.devDependencies && packageJson.devDependencies.sass) {
      addSuccess('SCSS支持依赖检查通过');
    }
  }
}

// 主要检查函数
function runArchitectureCheck() {
  log('🔍 V2架构合规检查开始...', 'blue');
  log('================================', 'blue');
  
  if (!fs.existsSync(V2_DIR)) {
    addError(`V2目录不存在: ${V2_DIR}`);
    return false;
  }
  
  checkDirectoryStructure();
  checkFileExtensions();
  checkStyleArchitecture();
  checkComponentStandards();
  checkCodeQuality();
  checkBarrelExports();
  checkTypeScriptConfig();
  checkViteConfig();
  checkDependencies();
  
  log('\n📊 检查结果汇总', 'blue');
  log('================================', 'blue');
  
  if (ERRORS.length === 0 && WARNINGS.length === 0) {
    log('🎉 架构检查完全通过！所有规范都已正确遵循。', 'green');
    return true;
  }
  
  if (ERRORS.length > 0) {
    log(`\n❌ 发现 ${ERRORS.length} 个错误:`, 'red');
    ERRORS.forEach((error, index) => {
      log(`  ${index + 1}. ${error}`, 'red');
    });
  }
  
  if (WARNINGS.length > 0) {
    log(`\n⚠️  发现 ${WARNINGS.length} 个警告:`, 'yellow');
    WARNINGS.forEach((warning, index) => {
      log(`  ${index + 1}. ${warning}`, 'yellow');
    });
  }
  
  log('\n💡 修复建议:', 'magenta');
  if (ERRORS.length > 0) {
    log('  1. 优先修复所有错误项', 'magenta');
    log('  2. 运行 npm run type-check 查看TypeScript错误详情', 'magenta');
  }
  if (WARNINGS.length > 0) {
    log('  3. 逐步改进警告项以提高代码质量', 'magenta');
  }
  log('  4. 定期运行 npm run check:v2 确保架构合规', 'magenta');
  
  if (ERRORS.length > 0) {
    log('\n💡 请修复所有错误后重新运行检查。', 'red');
    return false;
  } else {
    log('\n✅ 没有发现严重错误，但请关注警告项。', 'green');
    return true;
  }
}

// 运行检查
if (require.main === module) {
  const success = runArchitectureCheck();
  process.exit(success ? 0 : 1);
}

module.exports = { runArchitectureCheck }; 