// // scripts/liff-init.js - LIFF initialization

// let currentUser = null;
// let currentShop = CONFIG.DEFAULT_SHOP;

// async function initializeLIFF() {
//     try {
//         await liff.init({ liffId: CONFIG.LIFF_ID });

//         if (!liff.isLoggedIn()) {
//             liff.login();
//             return null;
//         }

//         // Get user profile
//         currentUser = await liff.getProfile();
//         console.log('User logged in:', currentUser.displayName);

//         // TODO: Fetch user's shop from database
//         // For now, use default shop
//         // currentShop = await getUserShop(currentUser.userId);

//         return currentUser;
//     } catch (error) {
//         console.error('LIFF initialization failed:', error);
//         return null;
//     }
// }

// // For local testing without LIFF
// function initializeWithoutLIFF() {
//     console.log('Running in test mode without LIFF');
//     currentUser = {
//         userId: 'test-user',
//         displayName: 'Test User'
//     };
//     currentShop = CONFIG.DEFAULT_SHOP;
//     return currentUser;
// }