import { db } from "./firebase"
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore"
import { MENU_ITEMS } from "./menu-data"

export async function seedMenuItems() {
  try {
    // Limpiar colección existente primero
    const existing = await getDocs(collection(db, "products"))
    const deletePromises = existing.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    // Insertar todos los productos
    const insertPromises = MENU_ITEMS.map((item) =>
      addDoc(collection(db, "products"), {
        ...item,
        available: true,
        createdAt: new Date().toISOString(),
      })
    )
    await Promise.all(insertPromises)

    console.log(`✅ ${MENU_ITEMS.length} productos subidos a Firestore`)
  } catch (error) {
    console.error("❌ Error al subir productos:", error)
  }
}