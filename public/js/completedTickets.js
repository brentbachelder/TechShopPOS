var collectiveCompleted = {};
var completedYear = 2099;
var completedMonth = 12;
var competedDay = 31;

function InitCompletedTickets(page = -1) {
    document.getElementById("page-title").innerHTML = "COMPLETED TICKETS";
    document.getElementById("mobile-page-title").innerHTML = "COMPLETED TICKETS";
    RetrieveCompleted(page);
}

function RetrieveCompleted(page) {
    if(page == -1) page = 1;
    var nextPage = true;

    var content = '';
    var sorted = GetDescending(Admin.RecentlyCompletedTickets);
    var count = 0;

    for(var outer in sorted) {
        count++;
        if(outer >= page * 20 - 20 && outer < page * 20) {
            for(var date in sorted[outer]) {
                var dateUpdate = date.substring(4,6) + "/" + date.substring(6,8) + "/" + date.substring(2,4);
                var ticketNum = sorted[outer][date].toString().substring(0,6);
                var custNum = sorted[outer][date].toString().substring(6);
                var custName = Customers[custNum].Name;
                var description = '';
                for(var key in Customers[custNum].Tickets) {
                    if(key == ticketNum) description = Customers[custNum].Tickets[key];
                }
                content += `
                    <a href="#ticket-${ticketNum}" class="individual-completed-container">
                        <div style="width: 84px; padding-left: 10px; font-size: 14px; font-weight: 500;">${dateUpdate}</div>
                        <div style="width: 84px; font-size: 14px; font-weight: 700;">#${ticketNum}</div>
                        <div style="flex-grow: 1;">
                            <div style="font-size: 12px; font-weight: 700;">${custName}</div>
                            <div style="font-size: 14px; font-weight: 500;">${description}</div>
                        </div>
                    </a>
                `;
            }
        }
    }
    if(count <= 20 * page) nextPage = false;
    
    DrawCompletedTickets(page, nextPage);
    document.getElementById('completed-tickets-container').innerHTML = content;
}

function DrawCompletedTickets(page, anotherPage = false) {
    var nextPage = parseInt(page) + 1;
    var previousPage = parseInt(page) - 1;
    var prevHref = `<a href="#completed-tickets?page${previousPage}" class="icon-box" style="margin-right: 0;"><div class="material-symbols-outlined">skip_previous</div></a>`;
    if(previousPage == 0) prevHref = '';
    var nextHref = `<a href="#completed-tickets?page${nextPage}" class="icon-box"><div class="material-symbols-outlined">skip_next</div></a>`;
    if(!anotherPage) nextHref = `<div class="icon-box no-hover"></div>`;
    var pageNumber = `<div style="width: 60px; font-size: 12px; font-weight: 700; text-align: center;">PAGE&nbsp;&nbsp;${page}</div>`;

    var content = `
    <div class="container">    
        <div class="object large">
            <header class="gray">
                <h1>RESULTS</h1>
                ${prevHref}
                ${pageNumber}
                ${nextHref}
            </header>
            <div style="width: 100%; display: flex; padding: var(--inner-padding); border-bottom: 1px solid var(--default); gap: calc(100% / 20); font-size: 12px; 
            font-weight: 700; text-align: left;">
                <div style="width: 84px; padding-left: 10px;">DATE</div>
                <div style="width: 84px; padding-left: 10px;">TICKET</div>
                <div style="flex-grow: 1;">INFO</div>
            </div>
            <div id="completed-tickets-container"></div>
        </div>
    </div>
    `;
    document.getElementById("frame").innerHTML = content;
    pageLoading = false;
}