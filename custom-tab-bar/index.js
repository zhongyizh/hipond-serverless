Component({
    data: {
        selected: 0,
        color: "#A4C5C2",
        selectedColor: "#A4C5C2",
        list: [ {
            pagePath: "/pages/tab-bar/index/index",
            iconPath: "/image/tab-bar/tab_index_normal.png",
            selectedIconPath: "/image/tab-bar/tab_index_active.png",
            text: "首页"
        }, {
            pagePath: "/pages/tab-bar/shop/shop",
            iconPath: "/image/tab-bar/tab_shop_normal.png",
            selectedIconPath: "/image/tab-bar/tab_shop_active.png",
            text: "商城",
        } , {
            pagePath: "/pages/post/new-post-select/new-post-select",
            iconPath: "/image/tab-bar/icon_add.png",
            selectedIconPath: "/image/tab-bar/icon_add.png",
            text: "",
            isSpecial: true
        }, {
            pagePath: "/pages/tab-bar/mine/mine",
            iconPath: "/image/tab-bar/tab_user_normal.png",
            selectedIconPath: "/image/tab-bar/tab_user_active.png",
            text: "我的"
        } , {
            pagePath: "/pages/tab-bar/more/more",
            iconPath: "/image/tab-bar/tab_more_normal.png",
            selectedIconPath: "/image/tab-bar/tab_more_active.png",
            text: "更多"
        } ]
    },
		attached() {
		},
    methods: {
			switchTab(e) {
				const data = e.currentTarget.dataset;
				const index = data.index, url = data.url;
				this.data.list[index].isSpecial ? wx.navigateTo({url}) : wx.switchTab({url});
			}
    }
});