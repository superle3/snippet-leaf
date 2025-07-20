browser.cookies.set({
    url: "https://www.overleaf.com",
    name: "overleaf_session2",
    value: process.env.OVERLEAF_TOKEN, // Ensure this is set in your .env file
    domain: "www.overleaf.com",
    path: "/",
    secure: true,
    httpOnly: true,
}).then(() => {
    console.log("Authentication cookie 'overleaf_session2' set for Overleaf.");
});
