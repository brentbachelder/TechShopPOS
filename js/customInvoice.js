function InitCustomInvoice(start, end) {
    document.getElementById("page-title").innerHTML = "CUSTOM INVOICE SEARCH";
    document.getElementById("mobile-page-title").innerHTML = "CUSTOM INVOICE SEARCH";
    GetCustomInvoices(start, end);
}

function GetCustomInvoices(start, end) {
    var ogStart = start;
    var ogEnd = end;
    var content = '';
    end = parseInt(end.substring(0,4)).toString() + (parseInt(end.substring(4,6)) - 1).toString() + parseInt(end.substring(6,8));
    var current = 0;
    var counter = 0;
    var totalSales = 0;
    var currentMonth = -1;
    while(current != end) {
        var newDay = new Date(parseInt(start.substring(0,4)), parseInt(start.substring(4,6)) - 1, parseInt(start.substring(6,8)));
        newDay.setDate(newDay.getDate() + counter);
        var year = newDay.getFullYear().toString();
        var month = (newDay.getMonth() + 1).toString();
        if(month < 10) month = '0' + month;
        if(currentMonth == -1) currentMonth = month;
        var day = newDay.getDate().toString();
        if(day < 10) day = '0' + day;
        current = newDay.getFullYear().toString() + newDay.getMonth().toString() + newDay.getDate().toString();
        var dayName = newDay.toLocaleDateString(navigator.languages[0], { weekday: 'long' });

        var classes = 'daily-search-container';
        if(month != currentMonth) {
            content += '<div style="width: 100%; height: 50px;"></div>';
            currentMonth = month;
            classes += ' top';
        }
        
        if(year in Admin.PaymentTotals && month in Admin.PaymentTotals[year] && day in Admin.PaymentTotals[year][month]) {
            content += `
                <div class="${classes}">
                    <div style="width: 24px; font-size: 12px; text-transform: uppercase;">${dayName.substring(0,3)}</div>
                    <div style="width: 84px; text-align: center;">${month}/${day}/${year.substring(2)}</div>
                    <div style="flex-grow: 1;">$${Admin.PaymentTotals[year][month][day]}</div>
                    <div class="view-invoices-link" tabindex="0" onclick="DrawDailyInvoices('${year}', '${month}', '${day}')">VIEW INVOICES</div>
                </div>
            `;
            totalSales += Admin.PaymentTotals[year][month][day];
        }
        else {
            content += `
            <div class="${classes}">
                <div style="width: 24px; font-size: 12px; text-transform: uppercase;">${dayName.substring(0,3)}</div>
                <div style="width: 84px; text-align: center;">${month}/${day}/${year.substring(2)}</div>
                <div style="flex-grow: 1;">$0</div>
            </div>
            `;
        }
        counter++;
    }
    DrawCustomInvoices(ogStart, ogEnd, totalSales);
    document.getElementById("custom-results-container").innerHTML = content;
}

function CustomInvoiceGoBack() {
    document.getElementById("custom-container").classList.remove("daily-shown");
}

async function DrawDailyInvoices(year, month, day) {
    var results = {};
    document.getElementById("custom-container").classList.add("daily-shown");
    document.getElementById("individual-invoices-header").innerHTML = `INVOICES FOR ${month}/${day}/${year}`;
    var content = '<div class="default-none">- NO INVOICES FOUND -</div>';
    
    await db.ref("Invoices/" + year + "/" + month + "/" + day).once('value').then(snap => {
        results = snap.val();
        if(results != null) {
            content = '';
            for(var key in results) {
                var type = 'shopping_bag';
                if("Type" in results[key] && results[key].Type == "Card") type = 'credit_card';
                else if("Type" in results[key] && results[key].Type == "Cash") type = 'payments';
                var note = '';
                if('Note' in results[key] && results[key].Note != '') note = `&nbsp;&nbsp;(${results[key].Note})`;
                var amount = `<div style="flex-grow: 1; color: var(--default);"><b>$${results[key].Amount.toFixed(2)}</b>${note}</div>`;
                if(results[key].Amount < 0) 
                    amount = `<div style="flex-grow: 1; color: darkred;"><b>-$${results[key].Amount.toFixed(2)}</b></div>`;

                content += `
                    <div style="display: flex; width: 100%; align-items:center; padding: var(--inner-padding) calc(100% / 20); gap: calc(100% / 20); height: 66px;">
                        <div style="width: 24px;" class="material-symbols-outlined">${type}</div>
                        <div style="width: 84px; text-align: center;">${month}/${day}/${year}</div>
                        ${amount}
                        <a href="#ticket-${results[key].Ticket}" class="recent-invoices-ticket-num">#${results[key].Ticket}</a>
                    </div>
                `;
            }
        }
    });
    
    document.getElementById("individual-invoices-container").innerHTML = content;
}

function DrawCustomInvoices(start, end, totalSales) {
    var todaysDate = DateConvert();
    var maxDate = todaysDate.substring(0,4) + "-" + todaysDate.substring(4,6) + "-" + todaysDate.substring(6,8);
    var startDate = start.substring(0,4) + "-" + start.substring(4,6) + "-" + start.substring(6,8);
    var endDate = end.substring(0,4) + "-" + end.substring(4,6) + "-" + end.substring(6,8);
    var content = `
   
    <div class="container" id="custom-container" style="max-height: 100%;">
        <div class="object medium results-summary" style="height: 228px;">
            <header class="gray">
                <h1>REVISE INVOICE SEARCH</h1>
            </header>
            <div id="custom-invoice-container" style="padding: var(--inner-padding);">
                <form style="width: 100%; height: 100%;" onsubmit="StartCustomInvoiceSearch(); return false;">        
                    <div style="display: flex; width: 100%; justify-content: center; align-items: center; gap:var(--inner-padding);">
                        <div style="width: 160px;">
                            <div style="font-size: 12px; font-weight: 700; padding: 0 0 3px var(--inner-padding);">Start Date</div>
                            <input type="date" required class="custom-invoice-date" onchange="AdjustEndDate(this.value)" value="${startDate}" id="start-date" max="${maxDate}" >
                        </div>
                        <div style="width: 160px;">
                        <div style="font-size: 12px; font-weight: 700; padding: 0 0 3px var(--inner-padding);">End Date</div>
                            <input type="date" required class="custom-invoice-date" onchange="AdjustStartDate(this.value)" value="${endDate}" id="end-date" max="${maxDate}">
                        </div>
                    </div>
                    <div style="width: 100%; display: flex; justify-content: center; padding: var(--inner-padding);">
                        <button>Revise</button>
                    </div>
                </form>
            </div>
        </div>
        <div class="object medium results-summary" style="height: 228px;">
            <header class="gray">
                <h1>SEARCH RESULTS SUMMARY</h1>
            </header>
            <div id="custom-invoice-summary-container" style="padding: var(--inner-padding);">
                <div style="display: flex; flex-direction: column; width: 100%; height: 150px; align-items: center; justify-content: center;">
                    <div style="font-size: 12px; font-weight: 700">TOTAL SALES FOR THIS PERIOD</div>    
                    <div style="font-size: 24px; font-weight: 700">$${totalSales.toFixed(2)}</div>
                </div>
            </div>
        </div>
        <div class="object medium custom-invoice-results">
            <header class="gray">
                <h1>SEARCH RESULTS</h1>
            </header>
            <div id="custom-results-container" style="padding: var(--inner-padding); height: 100%;"></div>
        </div>    
        <div class="object medium custom-invoice-daily">
            <header class="gray">
                <button id="daily-invoice-go-back" class="icon-box" onclick="CustomInvoiceGoBack()"><div class="material-symbols-outlined">arrow_back</div></button>
                <h1 id="individual-invoices-header">DAILY INVOICES</h1>
            </header>
            <div id="individual-invoices-container" style="padding: var(--inner-padding);">
                <div class="default-none">- NO DAY SELECTED -</div>
            </div>
        </div>
    </div>
    `;
    document.getElementById("frame").innerHTML = content;
    pageLoading = false;
}