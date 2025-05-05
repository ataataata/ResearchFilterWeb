"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExpandableAuthors } from "./ExpandableAuthors"

interface Paper {
  id: string
  names: string
  title: string
  journal: string
  year: string
  doi: string
  authors: string
  date: string
  keywords: string[]
  matchPercent: number
}

type SortField = "matchPercent" | "title" | "authors" | "date" | "keywords"
type SortDir   = "asc" | "desc"

const API = "http://0.0.0.0:8000"

export default function ResearchPaperFilter() {
  const [lastNameInput, setLastNameInput] = useState("")
  const [lastNames, setLastNames]         = useState<string[]>([])
  const [startDate, setStartDate]         = useState("")
  const [endDate, setEndDate]             = useState("")
  const [keyword, setKeyword]             = useState("")
  const [keywords, setKeywords]           = useState<string[]>([])
  const [csvFile, setCsvFile]             = useState<File | null>(null)

  const [papers, setPapers]               = useState<Paper[]>([])
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([])
  const [isLoading, setIsLoading]         = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const [sortBy,  setSortBy]  = useState<SortField>("matchPercent")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const onHeaderClick = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(field)
      setSortDir(field === "matchPercent" ? "desc" : "asc")
    }
  }

  const sortedPapers = [...papers].sort((a, b) => {
    let va: string | number, vb: string | number

    switch (sortBy) {
      case "keywords":
        va = a.keywords.join(", ")
        vb = b.keywords.join(", ")
        break
      case "authors":
        va = a.authors
        vb = b.authors
        break
      case "title":
        va = a.title
        vb = b.title
        break
      case "date":
        va = Date.parse(a.date) || 0
        vb = Date.parse(b.date) || 0
        break
      case "matchPercent":
      default:
        va = a.matchPercent
        vb = b.matchPercent
    }

    if (va < vb) return sortDir === "asc" ? -1 : 1
    if (va > vb) return sortDir === "asc" ? 1 : -1
    return 0
  })

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAddLastName = () => {
    if (lastNameInput && !lastNames.includes(lastNameInput)) {
      setLastNames([...lastNames, lastNameInput])
      setLastNameInput("")
    }
  }
  const handleRemoveLastName = (name: string) =>
    setLastNames(lastNames.filter(n => n !== name))

  const handleAddKeyword = () => {
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword])
      setKeyword("")
    }
  }
  const handleRemoveKeyword = (kw: string) =>
    setKeywords(keywords.filter(k => k !== kw))

  const handleReset = () => {
    setLastNameInput(""); setLastNames([])
    setStartDate(""); setEndDate("")
    setKeyword(""); setKeywords([])
    setCsvFile(null)
    setPapers([]); setSelectedPaperIds([]); setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = csvFile
        ? await (() => {
            const formData = new FormData()
            formData.append("file", csvFile)
            formData.append("startDate", startDate)
            formData.append("endDate", endDate)
            formData.append("keywords", keywords.join(","))
            formData.append("lastNames", lastNames.join(","))
            return fetch(`${API}/api/search-csv`, { method: "POST", body: formData })
          })()
        : await (() => {
            const params = new URLSearchParams({
              lastNames: lastNames.join(","),
              startDate,
              endDate,
              keywords: keywords.join(","),
            })
            return fetch(`${API}/api/papers?${params}`)
          })()

      if (!res.ok) throw new Error(await res.text())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await res.json()) as any[]

      const formatted: Paper[] = data.map(p => {
        const id    = p.id    ?? p.pmid    ?? String(Math.random())
        const names = p.names ?? p.authors ?? "Unknown Names"
        const title = p.title ?? "Unknown Title"
        const journal = p.journal ?? "Unknown Journal"
        const date  = p.date ?? p.publication_date ?? ""
        const year  =
          typeof p.year === "number"
            ? p.year.toString()
            : p.year ?? date.replace(/T.*$/, "")
        const doi   = p.doi ?? "No DOI"
        const kwArr =
          typeof p.keywords === "string"
            ? p.keywords.split(",").map((k:string) => k.trim())
            : Array.isArray(p.keywords)
              ? p.keywords
              : []
        const matchPercent = p.matchPercent ?? 0

        return {
          id,
          names,
          title,
          journal,
          year,
          doi,
          authors: names,
          date,
          keywords: kwArr,
          matchPercent,
        }
      })

      setPapers(formatted)
      setSelectedPaperIds([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPaper = (id: string, checked: boolean) =>
    setSelectedPaperIds(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)))

  const handleSelectAll = () =>
    setSelectedPaperIds(
      selectedPaperIds.length === papers.length ? [] : papers.map(p => p.id)
    )

  const handleDownload = () => {
    const toDL = selectedPaperIds.length
      ? papers.filter(p => selectedPaperIds.includes(p.id))
      : papers
    if (!toDL.length) return

    const header = ["Names","Paper Title","Journal","Year","DOI"]
    const rows   = toDL.map(p => [p.names, p.title, p.journal, p.year, p.doi])
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "filtered_papers.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        UMass IALS Core Facility Publication Searcher
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Last Names */}
        <div>
          <Label htmlFor="lastName">Last Name(s)</Label>
          <div className="flex space-x-2">
            <Input
              id="lastName"
              value={lastNameInput}
              onChange={e => setLastNameInput(e.target.value)}
              placeholder="Enter last name"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddLastName()
                }
              }}
            />
            <Button type="button" onClick={handleAddLastName}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {lastNames.map(name => (
              <Badge key={name} variant="secondary">
                {name}
                <button onClick={() => handleRemoveLastName(name)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* CSV Upload */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4">
            <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-200 text-sm font-medium text-gray-700">
              Upload CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => setCsvFile(e.target.files?.[0] || null)}
              />
            </label>
            {csvFile && (
              <span className="truncate max-w-xs text-sm text-gray-800">
                {csvFile.name}
              </span>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Keywords */}
        <div>
          <Label htmlFor="keyword">Keywords</Label>
          <div className="flex space-x-2">
            <Input
              id="keyword"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Enter a keyword"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddKeyword()
                }
              }}
            />
            <Button type="button" onClick={handleAddKeyword}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {keywords.map(kw => (
              <Badge key={kw} variant="secondary">
                {kw}
                <button onClick={() => handleRemoveKeyword(kw)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex gap-2">
            <Button type="button" onClick={handleReset} variant="secondary">
              Reset
            </Button>
            <Button type="button" onClick={handleDownload} disabled={!papers.length}>
              Download CSV
            </Button>
            <Button type="button" onClick={handleSelectAll} disabled={!papers.length}>
              {selectedPaperIds.length === papers.length ? "Clear All" : "Select All"}
            </Button>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Searching…" : "Search Papers"}
          </Button>
        </div>
      </form>

      {/* spacer */}
      <div className="h-6" />

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
          Error: {error}
        </div>
      )}

      {papers.length > 0 && (
        <div className="mb-4 flex items-center space-x-2 text-sm font-medium">
          <span className="text-gray-700">
            Showing {papers.length} result{papers.length > 1 ? "s" : ""}
          </span>
          {papers.length === 500 && (
            <span className="text-red-600">
              Please narrow down your search!
            </span>
          )}
        </div>
      )}

      <Table className="mt-8">
        <TableCaption>List of filtered research papers</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">
              <button
                className="flex items-center space-x-1"
                onClick={() => onHeaderClick("matchPercent")}
              >
                <span>Match %</span>
                {sortBy === "matchPercent" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
              </button>
            </TableHead>
            <TableHead className="w-8"></TableHead>
            <TableHead>
              <button
                className="flex items-center space-x-1"
                onClick={() => onHeaderClick("title")}
              >
                <span>Title</span>
                {sortBy === "title" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center space-x-1"
                onClick={() => onHeaderClick("authors")}
              >
                <span>Authors</span>
                {sortBy === "authors" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center space-x-1"
                onClick={() => onHeaderClick("date")}
              >
                <span>Date</span>
                {sortBy === "date" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center space-x-1"
                onClick={() => onHeaderClick("keywords")}
              >
                <span>Keywords</span>
                {sortBy === "keywords" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
              </button>
            </TableHead>
            <TableHead className="text-center">DOI</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedPapers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                {isLoading ? "Loading…" : "No papers found"}
              </TableCell>
            </TableRow>
          ) : (
            sortedPapers.map(paper => (
              <TableRow key={paper.id}>
                <TableCell>
                  <Badge variant={paper.matchPercent > 75 ? "default" : "secondary"}>
                    {paper.matchPercent.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedPaperIds.includes(paper.id)}
                    onChange={e => handleSelectPaper(paper.id, e.target.checked)}
                  />
                </TableCell>
                <TableCell>{paper.title}</TableCell>
                <TableCell>
                  <ExpandableAuthors authors={paper.authors} threshold={3} />
                </TableCell>
                <TableCell>{paper.date}</TableCell>
                <TableCell>{paper.keywords.join(", ")}</TableCell>
                <TableCell className="text-center">
                  {paper.doi !== "No DOI" ? (
                    <a
                      href={paper.doi.startsWith("http") ? paper.doi : `https://${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="text-xs px-2 py-1">
                        Open
                      </Button>
                    </a>
                  ) : (
                    "No DOI"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
