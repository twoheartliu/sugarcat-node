module.exports = {
  apps: [
    {
      name: 'sugarcat-node',
      script: 'app.mjs',
      watch: true,
      ignore_watch: ['node_modules', 'db.json'], // 忽略变化的文件/目录
    },
  ],
}
