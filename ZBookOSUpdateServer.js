(function(Scratch) {
  "use strict";

  const UPDATE_URL = "https://colvinwest054554.github.io/ZBookOSCloudAppStore/store.json"; // 注意：实际地址应该是更新服务器的JSON，但用户已经将store.json改为更新服务器内容，所以用同一个URL

  class ZBookUpdate {
    constructor() {
      this._cache = null;
    }

    getInfo() {
      return {
        id: "zbookupdate",
        name: "ZBookOS 更新服务器",
        blocks: [
          {
            opcode: "getLatestVersion",
            blockType: Scratch.BlockType.REPORTER,
            text: "ZBookOS 最新版本号"
          },
          {
            opcode: "getLatestBlog",
            blockType: Scratch.BlockType.REPORTER,
            text: "ZBookOS 最新版本的博客链接"
          },
          {
            opcode: "getLatestDownload",
            blockType: Scratch.BlockType.REPORTER,
            text: "ZBookOS 最新版本的下载链接"
          },
          {
            opcode: "getProductVersions",
            blockType: Scratch.BlockType.REPORTER,
            text: "ZBookOS 产品线 [PRODUCT] 的版本列表",
            arguments: {
              PRODUCT: {
                type: Scratch.ArgumentType.STRING,
                menu: "products",
                defaultValue: "digital"
              }
            }
          },
          {
            opcode: "getVersionChangelog",
            blockType: Scratch.BlockType.REPORTER,
            text: "ZBookOS 版本 [VERSION] 的更新日志",
            arguments: {
              VERSION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "3.0"
              }
            }
          },
          {
            opcode: "getVersionBlog",
            blockType: Scratch.BlockType.REPORTER,
            text: "ZBookOS 版本 [VERSION] 的博客链接",
            arguments: {
              VERSION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "3.0"
              }
            }
          },
          {
            opcode: "getVersionDownload",
            blockType: Scratch.BlockType.REPORTER,
            text: "ZBookOS 版本 [VERSION] 的下载链接",
            arguments: {
              VERSION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "3.0"
              }
            }
          }
        ],
        menus: {
          products: {
            acceptReporters: true,
            items: ["digital", "home", "tiny", "auto"]
          }
        }
      };
    }

    _fetchData() {
      if (this._cache) return Promise.resolve(this._cache);
      return fetch(UPDATE_URL)
        .then(r => r.json())
        .then(data => {
          this._cache = data;
          return data;
        })
        .catch(() => null);
    }

    // 辅助：在所有产品线的所有版本中查找第一个匹配版本号的对象
    _findVersion(versionStr) {
      return this._fetchData().then(data => {
        if (!data) return null;
        const products = data.products || {};
        for (const key of Object.keys(products)) {
          const versions = products[key].versions || [];
          for (const ver of versions) {
            if (ver.version === versionStr) {
              return ver;
            }
          }
        }
        return null;
      });
    }

    // 获取最新版本号
    getLatestVersion() {
      return this._fetchData().then(data => {
        if (!data) return "获取失败";
        return data.meta.current_latest || "未知";
      });
    }

    // 获取最新版本的博客链接（优先从digital产品线找）
    getLatestBlog() {
      return this._fetchData().then(data => {
        if (!data) return "获取失败";
        const latestVer = data.meta.current_latest;
        if (!latestVer) return "无最新版本";
        // 先在digital中找
        const digital = data.products && data.products.digital;
        if (digital && digital.versions) {
          for (const ver of digital.versions) {
            if (ver.version === latestVer) {
              return ver.blog_post || "";
            }
          }
        }
        // 如果digital中没有，则全局搜索
        return this._findVersion(latestVer).then(v => v ? (v.blog_post || "") : "未找到");
      });
    }

    getLatestDownload() {
      return this._fetchData().then(data => {
        if (!data) return "获取失败";
        const latestVer = data.meta.current_latest;
        if (!latestVer) return "无最新版本";
        const digital = data.products && data.products.digital;
        if (digital && digital.versions) {
          for (const ver of digital.versions) {
            if (ver.version === latestVer) {
              return ver.download_url || "";
            }
          }
        }
        return this._findVersion(latestVer).then(v => v ? (v.download_url || "") : "未找到");
      });
    }

    // 获取产品线的版本列表（返回JSON数组字符串）
    getProductVersions(args) {
      const product = args.PRODUCT;
      return this._fetchData().then(data => {
        if (!data) return "[]";
        const p = data.products && data.products[product];
        if (!p || !p.versions) return "[]";
        return JSON.stringify(p.versions);
      });
    }

    // 获取指定版本的更新日志
    getVersionChangelog(args) {
      return this._findVersion(args.VERSION).then(v => {
        if (!v) return "未找到该版本";
        return v.changelog || "";
      });
    }

    getVersionBlog(args) {
      return this._findVersion(args.VERSION).then(v => {
        if (!v) return "未找到该版本";
        return v.blog_post || "";
      });
    }

    getVersionDownload(args) {
      return this._findVersion(args.VERSION).then(v => {
        if (!v) return "未找到该版本";
        return v.download_url || "";
      });
    }
  }

  Scratch.extensions.register(new ZBookUpdate());
})(Scratch);
