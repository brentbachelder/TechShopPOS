function InitTicket(ticketNum) {
    DrawTicket(ticketNum);
}
















function DrawTicket(ticketNum) {
    var content = `
    
        Ticket #${ticketNum}
    
    `;
    $("#frame").html(content);
}