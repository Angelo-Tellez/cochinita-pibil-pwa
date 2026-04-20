"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { isAdmin } from "@/lib/admin-service"
import { getAllProducts, createProduct, updateProduct, deleteProduct, type Product } from "@/lib/products-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Pencil, Trash2, X, Check } from "lucide-react"
import { uploadImageToCloudinary } from "@/lib/cloudinary-service"
import Link from "next/link"

const CATEGORIES = ["Principales", "Sopas", "Acompañamientos", "Bebidas"]

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  description: "",
  price: 0,
  image: "",
  category: "Principales",
  calories: 0,
  portion: "",
  ingredients: "",
  details: "",
  available: true,
}

export default function AdminMenuPage() {
  const { user, isLoaded } = useAuth()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<Omit<Product, "id">>(emptyProduct)
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (isLoaded) {
        if (user) {
          const admin = await isAdmin(user.uid)
          setIsAdminUser(admin)
          if (admin) {
            setIsLoading(true)
            const data = await getAllProducts()
            setProducts(data)
            setIsLoading(false)
          }
        }
        setCheckingAdmin(false)
      }
    }
    checkAdmin()
  }, [user, isLoaded])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      calories: product.calories,
      portion: product.portion,
      ingredients: product.ingredients,
      details: product.details,
      available: product.available,
    })
    setImagePreview("")
    setImageFile(null)
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingProduct(null)
    setFormData(emptyProduct)
    setImageFile(null)
    setImagePreview("")
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
    setFormData(emptyProduct)
    setImageFile(null)
    setImagePreview("")
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      alert("El nombre y precio son obligatorios")
      return
    }
    setSaving(true)
    try {
      let imageUrl = formData.image
      if (imageFile) {
        setUploadingImage(true)
        imageUrl = await uploadImageToCloudinary(imageFile)
        setUploadingImage(false)
      }
      const dataToSave = { ...formData, image: imageUrl }
      if (editingProduct) {
        await updateProduct(editingProduct.id, dataToSave)
        setProducts(products.map((p) => p.id === editingProduct.id ? { ...dataToSave, id: editingProduct.id } : p))
      } else {
        const newId = await createProduct(dataToSave)
        setProducts([...products, { ...dataToSave, id: newId }])
      }
      handleCancel()
    } catch (error) {
      console.error("Error guardando producto:", error)
      alert("Error al guardar el producto")
    } finally {
      setSaving(false)
      setUploadingImage(false)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteProduct(product.id)
      setProducts(products.filter((p) => p.id !== product.id))
    } catch (error) {
      console.error("Error eliminando producto:", error)
      alert("Error al eliminar el producto")
    }
  }

  const handleToggleAvailable = async (product: Product) => {
    try {
      await updateProduct(product.id, { available: !product.available })
      setProducts(products.map((p) => p.id === product.id ? { ...p, available: !p.available } : p))
    } catch (error) {
      console.error("Error actualizando disponibilidad:", error)
    }
  }

  const filteredProducts = filterCategory === "all"
    ? products
    : products.filter((p) => p.category === filterCategory)

  if (checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando acceso...</p>
      </div>
    )
  }

  if (!user || !isAdminUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Sin Acceso</h2>
            <p className="text-muted-foreground mb-6">No tienes permisos para acceder al panel.</p>
            <Link href="/"><Button variant="outline">Volver al Menú</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
                Panel Admin
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Administrar Menú</h1>
            <Button onClick={handleNew} className="gap-2 bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" />
              Nuevo Platillo
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {showForm && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle>{editingProduct ? "Editar Platillo" : "Nuevo Platillo"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Cochinita Pibil Tradicional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Porción</label>
                  <Input
                    value={formData.portion}
                    onChange={(e) => setFormData({ ...formData, portion: e.target.value })}
                    placeholder="Ej: 200g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Calorías</label>
                  <Input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                {/* ← NUEVO: campo de imagen con Cloudinary */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Imagen del platillo</label>
                  {(imagePreview || formData.image) && (
                    <div className="mb-2">
                      <img
                        src={imagePreview || formData.image}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-lg border border-border"
                      />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg bg-background hover:bg-muted w-fit">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-foreground">
                        {imageFile ? imageFile.name : "Seleccionar imagen"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG o WebP. Máximo 5MB.</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Descripción corta</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción breve del platillo"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Ingredientes</label>
                  <Input
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    placeholder="Ej: Cerdo, achiote, cítricos..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Descripción detallada</label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="Descripción completa del platillo..."
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="available" className="text-sm font-medium">Disponible en el menú</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSave}
                  disabled={saving || uploadingImage}
                  className="gap-2 bg-primary text-primary-foreground"
                >
                  <Check className="h-4 w-4" />
                  {uploadingImage ? "Subiendo imagen..." : saving ? "Guardando..." : "Guardar"}
                </Button>
                <Button variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            size="sm"
            variant={filterCategory === "all" ? "default" : "outline"}
            onClick={() => setFilterCategory("all")}
          >
            Todos ({products.length})
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={filterCategory === cat ? "default" : "outline"}
              onClick={() => setFilterCategory(cat)}
            >
              {cat} ({products.filter((p) => p.category === cat).length})
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className={`${!product.available ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <span className="text-lg font-bold text-primary ml-2">${product.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge
                      className={`cursor-pointer ${product.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      onClick={() => handleToggleAvailable(product)}
                    >
                      {product.available ? "Disponible" : "No disponible"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}