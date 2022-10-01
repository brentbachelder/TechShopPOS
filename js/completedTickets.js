var collectiveCompleted = {};
var completedYear = 2099;
var completedMonth = 12;
var competedDay = 31;

function InitCompletedTickets(page = -1) {
    document.getElementById("page-title").innerHTML = "COMPLETED TICKETS";
    document.getElementById("mobile-page-title").innerHTML = "COMPLETED TICKETS";
    
    console.log("Completed Page is " + page);
    /*DrawReports();
    GetRecentInvoices();
    GetRecentCompletedTickets();
    CreateChart();
    UpdateReportChart();*/
}