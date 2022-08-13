function InitPartOrders() {
    DrawPartOrders();
}
















function DrawPartOrders() {
    var content = `
    
        <div class="container">
            <div class="object large" style="height: 200px;"></div>
            <div class="object medium" style="height: 200px;"></div>
            <div class="object small" style="height: 200px;"></div>
            <div class="object small" style="height: 200px;"></div>
            <div class="object medium" style="height: 200px;"></div>
            <div class="object small" style="height: 200px;"></div>
            <div class="object small" style="height: 200px;"></div>
            <div class="object small" style="height: 200px;"></div>
            <div class="object small" style="height: 200px;"></div>
            <div class="object large" style="height: 200px;"></div>
            <div class="object large" style="height: 200px;"></div>
        </div>
    
    `;
    $("#frame").html(content);
}