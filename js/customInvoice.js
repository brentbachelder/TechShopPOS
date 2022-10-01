function InitCustomInvoice(start, end) {
    document.getElementById("page-title").innerHTML = "CUSTOM INVOICE SEARCH";
    document.getElementById("mobile-page-title").innerHTML = "CUSTOM INVOICE SEARCH";
    GetCustomInvoices(start, end);
}

function GetCustomInvoices(start, end) {
    var content = '';
    end = parseInt(end.substring(0,4)).toString() + (parseInt(end.substring(4,6)) - 1).toString() + parseInt(end.substring(6,8));
    var current = 0;
    var counter = 0;
    while(current != end) {
        var newDay = new Date(parseInt(start.substring(0,4)), parseInt(start.substring(4,6)) - 1, parseInt(start.substring(6,8)));
        newDay.setDate(newDay.getDate() + counter);
        var year = newDay.getFullYear().toString();
        var month = (newDay.getMonth() + 1).toString();
        if(month < 10) month = '0' + month;
        var day = newDay.getDate().toString();
        if(day < 10) day = '0' + day;
        current = newDay.getFullYear().toString() + newDay.getMonth().toString() + newDay.getDate().toString();
        
        if(year in Admin.PaymentTotals && month in Admin.PaymentTotals[year] && day in Admin.PaymentTotals[year][month]) 
            content += `
                <div style="display: flex; width: 100%;">
                    <div style="width: 100px;">${month}/${day}/${year}</div>
                    <div style="flex-grow: 1;">$${Admin.PaymentTotals[year][month][day]}</div>
                    <div style="width: 160px;">VIEW INVOICES</div>
                </div>
            `;
        else {
            content += `
            <div style="display: flex; width: 100%;">
                <div style="width: 100px;">${month}/${day}/${year}</div>
                <div style="flex-grow: 1;">$0</div>
            </div>
            `;
        }
        counter++;
    }
    DrawCustomInvoices();
    document.getElementById("custom-results-container").innerHTML = content;
}





function DrawCustomInvoices() {
    var content = `
   
    <div class="container">
        <div class="object large">
            <header class="gray">
                <h1>SEARCH RESULTS SUMMARY</h1>
            </header>
            <div id="custom-invoice-summary-container" style="padding: var(--inner-padding);"></div>
        </div>
        <div class="object medium">
            <header class="gray">
                <h1>DAILY SEARCH RESULTS</h1>
            </header>
            <div id="custom-results-container" style="padding: var(--inner-padding); height: 100%;"></div>
        </div>    
        <div class="object medium">
            <header class="gray">
                <h1 id="individual-invoices-header">INVOICES FOR 09/30/2022</h1>
            </header>
            <div class="individual-invoices-container" style="padding: var(--inner-padding);"></div>
        </div>
    </div>
    `;
    $("#frame").html(content);
}