'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateSlug, CATEGORY_LABELS } from '@/lib/utils'
import { Upload, X, ImageIcon } from 'lucide-react'
import Image from 'next/image'

const CATEGORIES = Object.entries(CATEGORY_LABELS)

import { SubscriptionGate } from '@/components/subscription-gate'

export default function PerfilPageWrapper() {
  return (
    <SubscriptionGate>
      <PerfilPage />
    </SubscriptionGate>
  )
}

function PerfilPage() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', slug: '', description: '', address: '', city: '',
    phone: '', email: '', category: 'peluqueria', accepts_online_payment: false,
  })
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data: businesses } = await supabase.from('businesses').select('*').eq('owner_id', user.id).limit(1)
      const data = businesses?.[0] ?? null
      if (data) {
        setBusinessId(data.id)
        setForm({
          name: data.name, slug: data.slug, description: data.description,
          address: data.address, city: data.city, phone: data.phone,
          email: data.email, category: data.category,
          accepts_online_payment: data.accepts_online_payment,
        })
        setCoverImage(data.cover_image)
        setGalleryImages(data.images ?? [])
      }
    })
  }, [])

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: businessId ? f.slug : generateSlug(name) }))
  }

  const uploadCoverImage = async (file: File) => {
    if (!userId || !businessId) return
    setUploadingCover(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${businessId}/cover.${ext}`
    const { error: uploadError } = await supabase.storage.from('business-images').upload(path, file, { upsert: true })
    if (uploadError) { setError(uploadError.message); setUploadingCover(false); return }
    const { data: { publicUrl } } = supabase.storage.from('business-images').getPublicUrl(path)
    setCoverImage(publicUrl)
    await supabase.from('businesses').update({ cover_image: publicUrl }).eq('id', businessId)
    setUploadingCover(false)
  }

  const uploadGalleryImage = async (file: File) => {
    if (!userId || !businessId) return
    setUploadingGallery(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${businessId}/gallery-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('business-images').upload(path, file)
    if (uploadError) { setError(uploadError.message); setUploadingGallery(false); return }
    const { data: { publicUrl } } = supabase.storage.from('business-images').getPublicUrl(path)
    const newImages = [...galleryImages, publicUrl]
    setGalleryImages(newImages)
    await supabase.from('businesses').update({ images: newImages }).eq('id', businessId)
    setUploadingGallery(false)
  }

  const removeGalleryImage = async (url: string) => {
    if (!businessId) return
    const newImages = galleryImages.filter(img => img !== url)
    setGalleryImages(newImages)
    await supabase.from('businesses').update({ images: newImages }).eq('id', businessId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = { ...form, cover_image: coverImage, images: galleryImages }

    if (businessId) {
      const { error } = await supabase.from('businesses').update(payload).eq('id', businessId)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { data: biz, error } = await supabase.from('businesses').insert({ ...payload, owner_id: user.id }).select('id').single()
      if (error) { setError(error.message); setLoading(false); return }
      setBusinessId(biz.id)
      setUserId(user.id)
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {businessId ? 'Editar negocio' : 'Crear negocio'}
        </h1>
        <p className="text-slate-500 mt-1">{businessId ? 'Actualiza la información de tu negocio' : 'Configura tu perfil de negocio'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <Input
          label="Nombre del negocio *"
          value={form.name}
          onChange={e => handleNameChange(e.target.value)}
          placeholder="Ej: Barbería El Maestro"
          required
        />

        <Input
          label="URL personalizada"
          value={form.slug}
          onChange={e => setForm(f => ({ ...f, slug: generateSlug(e.target.value) }))}
          placeholder="barberia-el-maestro"
        />
        <p className="text-xs text-slate-400 -mt-4">
          Tu negocio aparecerá en: /negocios/{form.slug || 'tu-negocio'}
        </p>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Categoría *</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white"
          >
            {CATEGORIES.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe tu negocio, especialidades, ambiente..."
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-colors"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Dirección" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle Mayor 1" />
          <Input label="Ciudad" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Madrid" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Teléfono" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" />
          <Input label="Email de contacto" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="negocio@email.com" />
        </div>

        {/* Cover image */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Imagen de portada</label>
          {coverImage ? (
            <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-200 mb-2">
              <Image src={coverImage} alt="Portada" fill className="object-cover" />
              <button
                type="button"
                onClick={() => { setCoverImage(null); if (businessId) supabase.from('businesses').update({ cover_image: null }).eq('id', businessId) }}
                className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white text-red-600 shadow-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-xs text-slate-500 font-medium">Subir imagen de portada</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadCoverImage(f) }}
              />
            </label>
          )}
          {uploadingCover && <p className="text-xs text-indigo-600 mt-1 font-medium">Subiendo...</p>}
        </div>

        {/* Gallery images */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Galería de imágenes</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
            {galleryImages.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200">
                <Image src={url} alt={`Galería ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(url)}
                  className="absolute top-1.5 right-1.5 p-1 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white text-red-600 shadow-sm transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
              <ImageIcon className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-[10px] text-slate-500 font-medium text-center">Añadir</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => {
                  const files = e.target.files
                  if (files) Array.from(files).forEach(f => uploadGalleryImage(f))
                }}
              />
            </label>
          </div>
          {uploadingGallery && <p className="text-xs text-indigo-600 font-medium">Subiendo imágenes...</p>}
        </div>

        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
          <input
            type="checkbox"
            id="payment"
            checked={form.accepts_online_payment}
            onChange={e => setForm(f => ({ ...f, accepts_online_payment: e.target.checked }))}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="payment" className="text-sm text-slate-700">
            <span className="font-semibold">Aceptar pago online</span>
            <span className="block text-xs text-slate-500 mt-0.5">Los clientes podrán pagar al reservar su cita</span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 font-medium">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 font-medium">
            Cambios guardados correctamente
          </div>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full">
          {businessId ? 'Guardar cambios' : 'Crear negocio'}
        </Button>
      </form>
    </div>
  )
}
