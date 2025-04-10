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
  title: string
  authors: string
  date: string
  doi: string
  keywords: string[]
}

export default function ResearchPaperFilter() {
  const [lastNameInput, setLastNameInput] = useState("")
  const [lastNames, setLastNames] = useState<string[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [keyword, setKeyword] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)

  const handleAddLastName = () => {
    if (lastNameInput && !lastNames.includes(lastNameInput)) {
      setLastNames([...lastNames, lastNameInput])
      setLastNameInput("")
    }
  }

  const handleRemoveLastName = (nameToRemove: string) => {
    setLastNames(lastNames.filter((n) => n !== nameToRemove))
  }

  const handleAddKeyword = () => {
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword])
      setKeyword("")
    }
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== keywordToRemove))
  }

  const handleReset = () => {
    setLastNameInput("")
    setLastNames([])
    setStartDate("")
    setEndDate("")
    setKeyword("")
    setKeywords([])
    setCsvFile(null)
    setPapers([])
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let data
      if (csvFile) {
        const formData = new FormData()
        formData.append("file", csvFile)
        formData.append("startDate", startDate)
        formData.append("endDate", endDate)
        formData.append("keywords", keywords.join(","))
        formData.append("lastNames", lastNames.join(","))
        
        const res = await fetch("https://web-production-06c8c.up.railway.app/api/search-csv", {
          method: "POST",
          body: formData,
        })
        if (!res.ok) throw new Error(await res.text())
        data = await res.json()
      } else {
        const queryParams = new URLSearchParams({
          lastNames: lastNames.join(","),
          startDate,
          endDate,
          keywords: keywords.join(","),
        })
        const apiUrl = `https://web-production-06c8c.up.railway.app/api/papers?${queryParams.toString()}`
        const res = await fetch(apiUrl)
        if (!res.ok) throw new Error(await res.text())
        data = await res.json()
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted: Paper[] = data.map((p: any) => ({
        id: p.id || String(Math.random()),
        title: p.title || "Unknown Title",
        authors: p.authors || "Unknown Author",
        date: p.publication_date || p.date || "Unknown Date",
        doi: p.doi || "No DOI",
        keywords:
          typeof p.keywords === "string"
            ? p.keywords.split(",").map((k: string) => k.trim())
            : [],
      }))
      setPapers(formatted)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (papers.length === 0) return
    const header = ["Title", "Authors", "Date", "DOI", "Keywords"]
    const rows = papers.map((p) => [p.title, p.authors, p.date, p.doi, p.keywords.join(", ")])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "filtered_papers.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">UMass IALS Core Facility Publication Searcher</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Last Names Input */}
        <div>
          <Label htmlFor="lastName">Last Name(s)</Label>
          <div className="flex space-x-2">
            <Input
              id="lastName"
              value={lastNameInput}
              onChange={(e) => setLastNameInput(e.target.value)}
              placeholder="Enter last name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddLastName()
                }
              }}
            />
            <Button type="button" onClick={handleAddLastName}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {lastNames.map((name) => (
              <Badge key={name} variant="secondary">
                {name}
                <button onClick={() => handleRemoveLastName(name)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* CSV Upload Input */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4">
            <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-200 text-sm font-medium text-gray-700">
              Upload CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
            </label>
            {csvFile && <span className="truncate max-w-xs text-sm text-gray-800">{csvFile.name}</span>}
          </div>
        </div>

        {/* Date Range Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Keyword Input */}
        <div>
          <Label htmlFor="keyword">Keywords</Label>
          <div className="flex space-x-2">
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter a keyword"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddKeyword()
                }
              }}
            />
            <Button type="button" onClick={handleAddKeyword}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {keywords.map((kw) => (
              <Badge key={kw} variant="secondary">
                {kw}
                <button onClick={() => handleRemoveKeyword(kw)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex gap-2">
            <Button type="button" onClick={handleReset} variant="secondary">
              Reset
            </Button>
            <Button type="button" onClick={handleDownload} disabled={papers.length === 0}>
              Download Results as CSV
            </Button>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search Papers"}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
          Error: {error}
        </div>
      )}
      {/* Results Count */}
      {papers.length > 0 && (
        <>
          <br />
          <div className="h-4" /> {/* empty line spacer */}
          <div className="mb-4 text-sm text-gray-700 font-medium">
            Showing {papers.length} result{papers.length > 1 ? "s" : ""}
          </div>
        </>
      )}

      <Table className="mt-8">
        <TableCaption>List of filtered research papers</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Authors</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Keywords</TableHead>
            <TableHead className="text-center">DOI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {papers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                {isLoading ? "Loading..." : "No papers found"}
              </TableCell>
            </TableRow>
          ) : (
            papers.map((paper) => (
              <TableRow key={paper.id}>
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
