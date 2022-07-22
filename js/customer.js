function InitCustomer(customerNum) {
    DrawCustomer(customerNum);
}
















function DrawCustomer(customerNum) {
    var content = `
    
        Customer #${customerNum}
    
    `;
    $("#frame").html(content);
}