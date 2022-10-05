var collectiveInvoices = {};
var invoiceYear = new Date().getFullYear();
invoiceYear = parseInt(invoiceYear);
var invoiceMonth = new Date().getMonth() + 1;
invoiceMonth = parseInt(invoiceMonth);
var noMoreInvoices = false;


function InitInvoices(page = -1) {
    document.getElementById("page-title").innerHTML = "ALL INVOICES";
    document.getElementById("mobile-page-title").innerHTML = "ALL INVOICES";
    RetrieveInvoices(page);
}

async function RetrieveInvoices(page) {
    if(page == -1) page = 1;
    var nullCount = 0;

    if(!noMoreInvoices) {
        while(nullCount < 12 && Object.keys(collectiveInvoices).length < (page * 20)) {
            
            var monthString = invoiceMonth.toString();
            if(invoiceMonth < 10) monthString = "0" + invoiceMonth;

            await db.ref("Invoices/" + invoiceYear).child(monthString).once('value').then(snap => { 
                var invoiceResponse = snap.val();
                if(invoiceResponse == null) nullCount++;
                else {
                    for(var day in invoiceResponse) {
                        for(var key in invoiceResponse[day]) {
                            if(!(invoiceResponse[day][key].FullDate in collectiveInvoices) && !(invoiceResponse[day][key].RefundDate in collectiveInvoices)) {
                                var name = '(no name)';
                                var ticket = '';
                                if(invoiceResponse[day][key].Ticket != '') ticket = invoiceResponse[day][key].Ticket;
                                var updatedKey = invoiceResponse[day][key].FullDate;
                                if('RefundDate' in invoiceResponse[day][key]) updatedKey = invoiceResponse[day][key].RefundDate;
                                if(invoiceResponse[day][key].Customer in Customers) name = Customers[invoiceResponse[day][key].Customer].Name;

                                collectiveInvoices[updatedKey] = {"Invoice" : key, "Amount" : invoiceResponse[day][key].Amount, 
                                    "Note" : invoiceResponse[day][key].Note, "RefundAmount" : invoiceResponse[day][key].RefundAmount, "Type" : 
                                    invoiceResponse[day][key].Type, "Ticket" : ticket, "Name" : name, "CustNum" : invoiceResponse[day][key].Customer };
                            }
                        }
                    }
                }
            });
            invoiceMonth--;
            if(invoiceMonth == 0) { invoiceMonth = 12; invoiceYear--; }
            if(nullCount == 12) noMoreInvoices = true;
        }
    }
    DrawAllInvoices(page);
}

function DrawAllInvoices(page) {
    var content = '<div class="default-none">-NO INVOICES -</div>';
    var organizedInvoices = GetDescending(collectiveInvoices);
    var nextPage = true;
    for(var i = (page - 1) * 20; i < page * 20; i++) {
        if(i in organizedInvoices) {
            if(content == '<div class="default-none">-NO INVOICES -</div>') content = '';
            for(var date in organizedInvoices[i]) {
                var type = 'shopping_bag';
                if(organizedInvoices[i][date].Type == "Card") type = 'credit_card';
                else if(organizedInvoices[i][date].Type == "Cash") type = 'payments';
                var datePrinted = date.substring(4,6) + "/" + date.substring(6, 8) + "/" + date.substring(2,4);
                var nameLink = `<a href="#customer-${organizedInvoices[i][date].CustNum}" class="customer-name-link">${organizedInvoices[i][date].Name}</a>`;
                if(organizedInvoices[i][date].Name == '(no name)') nameLink = `<div class="customer-name-link">${organizedInvoices[i][date].Name}</div>`;
                var ticketLink = `<a href="#ticket-${organizedInvoices[i][date].Ticket}" class="customer-invoice-link">#${organizedInvoices[i][date].Ticket}</a>`;
                if(organizedInvoices[i][date].Ticket == "''") ticketLink = `<div class="customer-invoice-link"></div>`;
                content += `
                    <div style="display: flex; width: 100%; align-items:center; height: 60px; border-bottom: 1px solid var(--default); gap: calc(100% / 20); padding: 0 var(--inner-padding);">
                        <div style="width: 84px; text-align: center;">${datePrinted}</div>
                        <div style="width: 24px; text-align: center;" class="material-symbols-outlined">${type}</div>
                        <div class="invoice-list-amount">$${organizedInvoices[i][date].Amount.toFixed(2)}</div>
                        ${nameLink}
                        ${ticketLink}
                    </div>
                `;
            }
        }
        else nextPage = false;
    }
    DrawInvoices(page, nextPage);
    document.getElementById('invoices-container').innerHTML = content;
}

function DrawInvoices(page, anotherPage = false) {
    var nextPage = parseInt(page) + 1;
    var previousPage = parseInt(page) - 1;
    var prevHref = `<a href="#invoices?page${previousPage}" class="icon-box" style="margin-right: 0;"><div class="material-symbols-outlined">skip_previous</div></a>`;
    if(previousPage == 0) prevHref = '';
    var nextHref = `<a href="#invoices?page${nextPage}" class="icon-box"><div class="material-symbols-outlined">skip_next</div></a>`;
    if(!anotherPage) nextHref = `<div class="icon-box no-hover"></div>`;
    var pageNumber = `<div style="width: 60px; font-size: 12px; font-weight: 700; text-align: center;">PAGE&nbsp;&nbsp;${page}</div>`;

    var content = `
    <div class="container">    
        <div class="object large">
            <header class="gray">
                <h1>INVOICE LIST</h1>
                ${prevHref}
                ${pageNumber}
                ${nextHref}
            </header>
            <div style="width: 100%; display: flex; padding: var(--inner-padding); border-bottom: 1px solid var(--default); gap: calc(100% / 20); font-size: 12px; 
            font-weight: 700; text-align: left;">
                <div style="width: 84px; padding-left: 10px;">DATE</div>
                <div style="width: 24px;">TYPE</div>
                <div class="invoice-list-amount">AMOUNT</div>
                <div class="customer-name-link">CUSTOMER NAME</div>
                <div style="width: 80px; text-align: center;">TICKET #</div>
            </div>
            <div id="invoices-container"></div>
        </div>
    </div>
    `;
    $("#frame").html(content);
}