function InitOpenTickets() {
    document.getElementById("page-title").innerHTML = "OPEN TICKETS";
    document.getElementById("mobile-page-title").innerHTML = "OPEN TICKETS";
    DrawOpenTickets();
    UpdateOpenTicketsList();
}

async function UpdateOpenTicketsList() {
    var ticketsInProgress = {};
    var currentlyUsedStatuses = [];

    for(var ticketNum in OpenTickets) {
        await db.ref("Tickets").child(ticketNum).once('value').then(snap => { 
            var ticketResponse = snap.val();
            if(!currentlyUsedStatuses.includes(ticketResponse.Status)) currentlyUsedStatuses.push(ticketResponse.Status);

            var repairDescription = GetRepairDescription(ticketResponse);
            var data = { "Name" : Customers[ticketResponse.Customer].Name, "Status" : ticketResponse.Status, "DateCreated" : 
                ticketResponse.DateCreated, "Description" : repairDescription };
            ticketsInProgress[ticketNum] = data;
        });
    }
    CreateStatusParents(currentlyUsedStatuses);
    DrawIndividualOpenTickets(ticketsInProgress);
}

function CreateStatusParents(statuses) {
    var content = '';
    statuses = statuses.sort();
    for(var i = 0; i < statuses.length; i++) {
        content += `
            <div class="object large">
                <header class="gray">
                    <h1>${statuses[i].toUpperCase()}</h1>
                    <div class="icon-box"><div class="material-symbols-outlined">menu</div></div>
                </header>
                <div id="${statuses[i]}" class="info-container">
                </div>
            </div>
        `;
    }
    document.getElementById("open-ticket-container").innerHTML = content;
}

function DrawIndividualOpenTickets(ticketsInProgress) {
    for(var key in ticketsInProgress) {
        var dropdown = StatusDropdown(key, ticketsInProgress[key].Status);
        var date = DateToText(ticketsInProgress[key].DateCreated);
        var content = `
            <div class="open-ticket-container">
                <a href="#ticket" class="ticket-num">#${key}</a>
                <a href="#ticket" class="name-device">
                    <div class="name">${ticketsInProgress[key].Name}</div>
                    <div class="device">${ticketsInProgress[key].Description}</div>
                </a>
                ${dropdown}
                <a href="#ticket" class="clock-date">
                    <div class="material-symbols-outlined">update</div>
                    <div class="date">${date}</div>
                </a>
            </div>
        `;
        document.getElementById(ticketsInProgress[key].Status).innerHTML += content;
    }
}

function DrawOpenTickets() {
    var content = `
    
        <div id="open-ticket-container" class="container">
        </div>
    
    `;
    $("#frame").html(content);
}