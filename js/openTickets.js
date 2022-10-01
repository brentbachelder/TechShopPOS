var ticketsInProgress = {};
var currentlyUsedStatuses = [];

function InitOpenTickets() {
    document.getElementById("page-title").innerHTML = "OPEN TICKETS";
    document.getElementById("mobile-page-title").innerHTML = "OPEN TICKETS";
    UpdateOpenTicketsList();
}

async function UpdateOpenTicketsList() {
    if(openTicketsChange && OpenTickets != null) {
        for(var key in ticketsInProgress) delete ticketsInProgress[key];
        for(var ticketNum in OpenTickets) {
            await db.ref("Tickets").child(ticketNum).once('value').then(snap => { 
                var ticketResponse = snap.val();
                //if(!currentlyUsedStatuses.includes(ticketResponse.Status)) currentlyUsedStatuses.push(ticketResponse.Status);

                var repairDescription = GetRepairDescription(ticketResponse);
                var data = { "Name" : Customers[ticketResponse.Customer].Name, "Status" : ticketResponse.Status, "DateCreated" : 
                    ticketResponse.DateCreated, "Description" : repairDescription };
                ticketsInProgress[ticketNum] = data;
            });
        }
        currentlyUsedStatuses = GetCurrentlyUsedStatuses();
        openTicketsChange = false;
    }
    DrawOpenTickets();
    CreateStatusParents(currentlyUsedStatuses);
    DrawIndividualOpenTickets(ticketsInProgress);
}

function GetCurrentlyUsedStatuses() {
    statuses = [];
    for(var key in ticketsInProgress) {
        if(!statuses.includes(ticketsInProgress[key].Status)) statuses.push(ticketsInProgress[key].Status);
    }
    return statuses;
}

function CreateStatusParents(statuses) {
    var content = '';
    statuses = statuses.sort();
    for(var i = 0; i < statuses.length; i++) {
        content += `
            <div class="object large">
                <header class="gray">
                    <h1>${statuses[i].toUpperCase()}</h1>
                    <button class="icon-box"><div class="material-symbols-outlined">expand_more</div></button>
                </header>
                <div id="${statuses[i]}" class="info-container">
                </div>
            </div>
        `;
    }
    if(content != '') document.getElementById("open-ticket-container").innerHTML = content;
}

function DrawIndividualOpenTickets(ticketsInProgress) {
    var newTicketsInProgress = GetDescending(ticketsInProgress);
    for(var outer in newTicketsInProgress) {
        for(var key in newTicketsInProgress[outer]) {
            var dropdown = StatusDropdown(key, ticketsInProgress[key].Status);
            var date = DateToText(ticketsInProgress[key].DateCreated);
            var content = `
                <div class="open-ticket-container">
                    <a href="#ticket-${key}" class="ticket-num">#${key}</a>
                    <a href="#ticket-${key}" class="name-device">
                        <div class="name">${ticketsInProgress[key].Name}</div>
                        <div class="device">${ticketsInProgress[key].Description}</div>
                    </a>
                    ${dropdown}
                    <a href="#ticket-${key}" class="clock-date">
                        <div class="material-symbols-outlined">update</div>
                        <div class="date">${date}</div>
                    </a>
                </div>
            `;
            document.getElementById(ticketsInProgress[key].Status).innerHTML += content;
        }
    }
}

function DrawOpenTickets() {
    var content = `
        <div class="container">
            <div id="open-ticket-container" class="container">
                <div class="object large">
                    <header class="gray">
                        <h1>ALL TICKETS</h1>
                    </header>
                    <div class="default-none">- NO OPEN TICKETS -</div>
                </div>    
            </div>
        </div>
    `;
    $("#frame").html(content);
}