// Connect to Firebase & Firebase variables
const firebaseConfig = { apiKey: "AIzaSyDOtLSWgGUh8RmwCeGbx1Dff0hOMXJjSZk", authDomain: "techshop-pos.firebaseapp.com", databaseURL: "https://techshop-pos-default-rtdb.firebaseio.com", projectId: "techshop-pos", storageBucket: "techshop-pos.appspot.com", messagingSenderId: "354861564177", appId: "1:354861564177:web:0c9d441a4976aeb46cccb0" }; firebase.initializeApp(firebaseConfig);
const db = firebase.database();
var finishedLoading = false;
var postLoadingPage = "";
var openTicketsChange = false;
var testModeComplete = false;

// Object variables for database information
var Customers = {}, CustomerSearch = {}, TicketSearch = [], OpenTickets = {}, Settings = {}, Admin = {}, Prices = {}, Parts = {};
var popupShown = false;

// Initialize the App
async function InitializeApp() {
    await TestMode();
    testModeComplete = true;

    await db.ref("Customers").once('value').then(snap => {
        UpdateCustomerList(snap.val());
    });

    await db.ref("OpenTickets").on('value', function (snap) {
        OpenTickets = snap.val();
        openTicketsChange = true;
    });
    
    // On value change listener for Prices
    await db.ref("Prices").on('value', function (snap) {
        Prices = snap.val();
    });
    
    // On value change listener for Part Orders
    await db.ref("Parts").on('value', function (snap) {
        Parts = snap.val();
    });
    
    // On value change listener for Settings
    await db.ref("Settings").on('value', function (snap) {
        Settings = snap.val();
        document.getElementById("business-name-primary").innerHTML = Settings.General.BusinessName;
        document.getElementById("business-name-secondary").innerHTML = Settings.General.BusinessCity + ", " + Settings.General.BusinessState;
    });
    
    // On value change listener for Admin
    await db.ref("Admin").on('value', function (snap) {
        Admin = snap.val();
    });

    InitializeDarkTheme();
    // Show Loading Screen
    CheckHashOnLoadAndReload();
    finishedLoading = true;
    document.getElementById("page-frame").classList.add("hidden"); // Remove loading Screen
    ChangePage(postLoadingPage);
}

// Check the hash status on load and reload
function CheckHashOnLoadAndReload() {
    postLoadingPage = window.location.hash.split("#")[1];
    //if(postLoadingPage == undefined || postLoadingPage == "") postLoadingPage = "dashboard";
    location.hash = 'dashboard';
    postLoadingPage = "dashboard";
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
