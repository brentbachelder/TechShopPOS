// Connect to Firebase & Firebase variables
const firebaseConfig = { apiKey: "AIzaSyA2RDAkP6U-bivHEIauv6PsKKj9sMRFxqA",	authDomain: "brent-test-pos.firebaseapp.com", databaseURL: "https://brent-test-pos-default-rtdb.firebaseio.com", projectId: "brent-test-pos", storageBucket: "brent-test-pos.appspot.com", messagingSenderId: "775384518901", appId: "1:775384518901:web:f2994fed56d9d15c8135bc", measurementId: "G-DYCSZYQMHE" }; firebase.initializeApp(firebaseConfig);
const db = firebase.database();
var finishedLoading = false;
var postLoadingPage = "";
var openTicketsChange = false;

// Object variables for database information
var Customers = {}, CustomerSearch = {}, TicketSearch = [], OpenTickets = {}, Settings = {}, Admin = {}, Prices = {}, Parts = {};

// Initialize the App
function InitializeApp() {
    InitializeDarkTheme();
    // Show Loading Screen
    CheckHashOnLoadAndReload();

    db.ref("Customers").once('value').then(snap => {
        UpdateCustomerList(snap.val());
        finishedLoading = true;
        document.getElementById("page-frame").classList.add("hidden"); // Remove loading Screen
        ChangePage(postLoadingPage);
        //Hide Loading Screen
    });
}

// Check the hash status on load and reload
function CheckHashOnLoadAndReload() {
    postLoadingPage = window.location.hash.split("#")[1];
    if(postLoadingPage == undefined || postLoadingPage == "") postLoadingPage = "dashboard";
}

// Update Customer List and Ticket #'s for search
function UpdateCustomerList(snapshot) {
    Customers = snapshot;
    TicketSearch = [];
    for(var key in Customers) {
        CustomerSearch[key] = {"Name" : Customers[key].Name, "Phone" : Customers[key].Phone };
        for(var ticket in Customers[key].Tickets) {
            TicketSearch.push(ticket);
        }
    }
}

// On value change listener for Open Tickets
db.ref("OpenTickets").on('value', function (snap) {
    OpenTickets = snap.val();
    openTicketsChange = true;
});

// On value change listener for Prices
db.ref("Prices").on('value', function (snap) {
    Prices = snap.val();
});

// On value change listener for Part Orders
db.ref("Parts").on('value', function (snap) {
    Parts = snap.val();
});

// On value change listener for Settings
db.ref("Settings").on('value', function (snap) {
    Settings = snap.val();
    document.getElementById("business-name-primary").innerHTML = Settings.General.BusinessName;
    document.getElementById("business-name-secondary").innerHTML = Settings.General.BusinessCity + ", " + Settings.General.BusinessState;
});

// On value change listener for Admin
db.ref("Admin").on('value', function (snap) {
    Admin = snap.val();
});