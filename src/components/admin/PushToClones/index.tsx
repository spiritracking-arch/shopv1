'use client'
import { Button } from '@/components/ui/button'
import { useDocumentInfo } from '@payloadcms/ui'
import React, { useState } from 'react'

const LANGS = ['fr','de','es','it','nl','pt','ro','cs','hu','sv','da','fi','sk','bg','hr','el','lt','lv','sl','et','mt','ga']

console.log('PushToClones mounted')
export const PushToClones: React.FC = () => {
  const { id } = useDocumentInfo()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [selectedLangs, setSelectedLangs] = useState<string[]>(LANGS)

  const handlePush = async () => {
    if (!id) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/push-to-clones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, langs: selectedLangs }),
      })
      const data = await res.json()
      setResult(data.message || '✅ Poussé avec succès!')
    } catch (e) {
      setResult('❌ Erreur lors du push')
    } finally {
      setLoading(false)
    }
  }

  const toggleLang = (lang: string) => {
    setSelectedLangs(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  return (
    <div className="p-4 border rounded-lg mt-4">
      <h3 className="font-medium mb-3">🌍 Push vers les clones</h3>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {LANGS.map(lang => (
          <button
            key={lang}
            onClick={() => toggleLang(lang)}
            className={`px-2 py-1 text-xs rounded border ${
              selectedLangs.includes(lang)
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-500 border-gray-300'
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setSelectedLangs(LANGS)}
          className="text-xs text-blue-500 underline"
        >
          Tout sélectionner
        </button>
        <button
          onClick={() => setSelectedLangs([])}
          className="text-xs text-gray-500 underline"
        >
          Tout désélectionner
        </button>
      </div>

      <Button
        onClick={handlePush}
        disabled={loading || selectedLangs.length === 0}
        className="w-full"
      >
        {loading ? '⏳ Push en cours...' : `🚀 Push vers ${selectedLangs.length} clone(s)`}
      </Button>

      {result && (
        <p className="mt-2 text-sm text-center">{result}</p>
      )}
    </div>
  )
}
