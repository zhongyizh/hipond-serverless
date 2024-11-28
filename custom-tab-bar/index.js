import { getMyUserInfo } from '../utils/util'

Component({
    data: {
      selected: 0,
      color: "#A4C5C2",
      selectedColor: "#A4C5C2",
      list: [
        {
          pagePath: "/pages/tab-bar/index/index",
          iconPath: "/image/tab-bar/tab_index_normal.png",
          selectedIconPath: "/image/tab-bar/tab_index_active.png",
          text: "首页",
        },
        {
          pagePath: "/pages/tab-bar/shop/shop",
          iconPath: "/image/tab-bar/tab_shop_normal.png",
          selectedIconPath: "/image/tab-bar/tab_shop_active.png",
          text: "商城",
        },
        {
          pagePath: "/pages/post/new-post-select/new-post-select",
          iconPath: "/image/tab-bar/icon_add.png",
          selectedIconPath: "/image/tab-bar/icon_add.png",
          text: "",
          isSpecial: true,
        },
        {
          pagePath: "/pages/tab-bar/mine/mine",
          iconPath: "/image/tab-bar/tab_user_normal.png",
          selectedIconPath: "/image/tab-bar/tab_user_active.png",
          text: "我的",
        },
        {
          pagePath: "/pages/tab-bar/more/more",
          iconPath: "/image/tab-bar/tab_more_normal.png",
          selectedIconPath: "/image/tab-bar/tab_more_active.png",
          text: "更多",
        },
      ],
    },
    attached() {},
    methods: {
      async switchTab(e) {
        const data = e.currentTarget.dataset;
        const index = data.index, url = data.url;
  
        if (this.data.list[index].isSpecial) {
          // 对于特殊按钮调用 checkUserInfo
          const isUserEligible = await this.checkUserInfo();
          if (isUserEligible) {
            wx.navigateTo({ url });
          }
        } else {
          wx.switchTab({ url });
        }
      },
      
      async checkUserInfo() {
        wx.showLoading({
          title: "获取用户信息中，请耐心等待...",
          mask: true,
        });
        try {
          const userData = await getMyUserInfo();
          wx.hideLoading();
  
          if (userData && userData.nickname && (userData.phone || userData.emailAddress)) {
            console.log("用户已填写信息，符合发帖条件");
            return true;
          } else {
            wx.navigateTo({
              url: "/pages/login/login",
            });
            return false;
          }
        } catch (error) {
          wx.hideLoading();
          console.error("获取用户信息失败:", error);
          wx.showToast({
            title: "获取用户信息失败",
            icon: "none",
          });
          return false;
        }
      },
    },
  });
  