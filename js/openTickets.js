var ticketsInProgress = {};

function InitOpenTickets() {
    DrawOpenTickets();
    UpdateOpenTicketsList();
}

function UpdateOpenTicketsList() {
    var content = ``;
    // Clear Previous ticketsInProgress object then re-populate
    ticketsInProgress = {};
    for(var ticketNum in OpenTickets) GetIndividualTicket(ticketNum); // OpenTickets variable is set in the Firebase call
    console.log(ticketsInProgress);
}

function GetIndividualTicket(ticketNum) {
    db.ref("Tickets").child(ticketNum).once('value').then(snap => { 
        var ticketResponse = snap.val();
        var repairDescription = GetRepairDescription(ticketResponse);
        ticketsInProgress[ticketNum] = { "Name" : Customers[ticketResponse.Customer].Name, "Status" : ticketResponse.Status, "DateCreated" : 
            ticketResponse.DateCreated, "Description" : repairDescription };
    });
}

function StatusDropdown() {
    /*<div class="selectdiv">
        <label>
            <select onchange="dashboardChangeStatus(${ticketsWithStatus[i]}, this.value)">`;
                for(var status in settings.Tickets.Status) {
                    if(settings.Tickets.Status[status].Display != '') {
                        if(status == key) content += `<option value="${settings.Tickets.Status[status].Display}" selected>
                            ${settings.Tickets.Status[status].Display}&nbsp;&nbsp;&nbsp;</option>`;
                        else content += `<option value="${settings.Tickets.Status[status].Display}">
                            ${settings.Tickets.Status[status].Display}&nbsp;&nbsp;&nbsp;</option>`;
                    }
                }
            content += `</select>
        </label>
    </div>*/
}











function DrawOpenTickets() {
    var content = `
    
        <div class="container">
            <div class="object large" style="height: 160px;">
                <h1>IN PROGRESS</h1>
                <div id="in-progress" class="info-container">
                    <div class="open-ticket-container">
                        <a href="#ticket" class="ticket-num">#382838</a>
                        <a href="#ticket" class="name-device">
                            <div class="name">Brent Bachelder</div>
                            <div class="device">iPhone 7 Plus - Charging Port</div>
                        </a>
                        <div class="selectdiv">
                            <label>
                                <select>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Something" selected>Something else</option>
                                </select>
                            </label>
                        </div>
                        <a href="#ticket" class="clock-date">
                            <div class="material-symbols-outlined">update</div>
                            <div class="date">4 Hours Ago</div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    
    `;
    $("#frame").html(content);
}