"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X } from 'lucide-react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Paper = {
  id: string
  title: string
  author: string
  date: string
  keywords: string[]
}

export default function ResearchPaperFilter() {
  const [fullName, setFullName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [keyword, setKeyword] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [papers] = useState<Paper[]>([]) // This would be populated from the server

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
    // Here you would typically make an API call to your server
    // For demonstration, we'll just log the form data
    console.log({ fullName, startDate, endDate, keywords })
    // In a real application, you'd fetch the filtered papers from the server and update the state
    // setPapers(await fetchPapers(fullName, startDate, endDate, keywords))
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
        <Button type="submit">Search Papers</Button>
      </form>

      <Table className="mt-8">
        <TableCaption>List of filtered research papers</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Keywords</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {papers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No papers found
              </TableCell>
            </TableRow>
          ) : (
            papers.map((paper: Paper) => (
              <TableRow key={paper.id}>
                <TableCell>{paper.title}</TableCell>
                <TableCell>{paper.author}</TableCell>
                <TableCell>{paper.date}</TableCell>
                <TableCell>{paper.keywords.join(", ")}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
