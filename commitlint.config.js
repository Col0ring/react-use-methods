/**
 * build : 改变了build工具 如 webpack
 * ci : 持续集成新增
 * chore : 构建过程或辅助工具的变动
 * feat : 新功能
 * docs : 文档改变
 * fix : 修复bug
 * perf : 性能优化
 * refactor : 某个已有功能重构
 * revert : 撤销上一次的 commit
 * style : 代码格式改变
 * test : 增加测试
 * anno: 增加注释
 */
// yarn global add commitizen cz-conventional-changelog 全局安装，按照 commitizen 后使用 git cz 代替 git commit，cz-conventional-changelog 是用于 cz 的适配器
// cz-conventional-changelog  可本地安装然后在 package.json 中指定
// echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc

// commitlint 对 commit message 进行格式校验
module.exports = {
  // 标准
  extends: ['@commitlint/config-conventional', '@commitlint/config-angular'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build',
        'ci',
        'chore',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'anno',
      ],
    ],
  },
}
