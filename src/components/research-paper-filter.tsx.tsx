"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Paper = {
  id: string
  title: string
  author: string
  date: string
  doi: string        // New field for DOI link
  keywords: string[]
}

export default function ResearchPaperFilter() {
  const [fullName, setFullName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [keyword, setKeyword] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddKeyword = () => {
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword])
      setKeyword("")
    }
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== keywordToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        fullName,
        startDate,
        endDate,
        keywords: keywords.join(","),
      })

      const apiUrl = `https://web-production-06c8c.up.railway.app/api/papers?${queryParams.toString()}`
      console.log("Fetching from:", apiUrl)

      const res = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("API Error Response:", errorText)
        throw new Error(`API request failed with status ${res.status}. Error: ${errorText}`)
      }

      const data = await res.json()
      console.log("Received data:", data)

      // Map the API response to our Paper type including DOI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedPapers: Paper[] = data.map((paper: any) => ({
        id: paper.id || String(Math.random()),
        title: paper.title || "Unknown Title",
        author: paper.names || paper.author || "Unknown Author",
        date: paper.publication_date || paper.date || "Unknown Date",
        doi: paper.doi || "No DOI",   // Get the DOI from the API
        keywords: paper.keywords
          ? typeof paper.keywords === "string"
            ? paper.keywords.split(",").map((k: string) => k.trim())
            : paper.keywords
          : [],
      }))

      setPapers(formattedPapers)
    } catch (err) {
      console.error("Error fetching papers:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">UMass IALS Core Facility Publication Searcher</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Last Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter researcher's last name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
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
                <button type="button" onClick={() => handleRemoveKeyword(kw)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search Papers"}
        </Button>
      </form>

      {error && <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">Error: {error}</div>}

      <Table className="mt-8">
        <TableCaption>List of filtered research papers</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>DOI</TableHead> {/* New column for DOI */}
            <TableHead>Keywords</TableHead>
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
            papers.map((paper: Paper) => (
              <TableRow key={paper.id}>
                <TableCell>{paper.title}</TableCell>
                <TableCell>{paper.author}</TableCell>
                <TableCell>{paper.date}</TableCell>
                <TableCell>
                  {paper.doi !== "No DOI" ? (
                    <a
                      href={paper.doi.startsWith("http") ? paper.doi : `https://${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {paper.doi}
                    </a>
                  ) : (
                    "No DOI"
                  )}
                </TableCell>
                <TableCell>{Array.isArray(paper.keywords) ? paper.keywords.join(", ") : paper.keywords}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
