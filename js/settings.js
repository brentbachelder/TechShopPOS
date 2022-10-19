var subpage = '';
function InitSettings(page) {
    subpage = page;
    DrawSettings();
}
















function DrawSettings() {
    var content = `
    
        Settings - ${subpage};
    
    `;
    $("#frame").html(content);
    pageLoading = false;
}