// Import Firestore functions from Firebase
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Fetch products from Firestore
export async function fetchProducts() {
    // Reference to the 'products' collection in Firestore
    const productsCol = collection(db, 'products');
    // Get all documents in the 'products' collection
    const productSnapshot = await getDocs(productsCol);
    // Map each document to an object containing its data and ID
    const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Return the list of products
    return productList;
}