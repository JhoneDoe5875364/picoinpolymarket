
"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Suggestion } from '@/lib/types';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { apiFetchWithToken } from '@/lib/api';


export function SuggestionManager() {
    const { toast } = useToast();
    // Directly use the imported marketSuggestions array, which is mutated by the server action.
    // The key is to manage a state that can be re-triggered to cause a re-render.
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [loading, setLoading] = useState(false);

    const qs = useMemo(() => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        return params.toString();
    }, [page, limit]);

    async function load() {
        setLoading(true);
        try {
            const res = await apiFetchWithToken(`/suggestions?${qs}`, { method: "GET" });
            setSuggestions(res.items || []);
            setTotal(res.total || 0);
        } catch (e: any) {
            toast({ title: "Load failed", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [qs]);

    const handleApproval = async (suggestionId: string, isApproved: boolean) => {
        const suggestion = suggestions.find(s => s.id === suggestionId);
        if (!suggestion) return;

        const action = isApproved ? "approved" : "rejected";
        const res = await apiFetchWithToken(`/suggestions/${suggestionId}/status/${action}`, {
            method: "POST",
        });

        if (res.ok) {
            setSuggestions(prev => prev.filter(s => s.id !== suggestionId));

            toast({
                title: `Suggestion ${isApproved ? "Approved" : "Denied"}`,
                description: isApproved
                    ? `Market "${suggestion.title}" has been created.`
                    : "The market suggestion has been denied.",
                variant: isApproved ? "default" : "destructive",
            });
        }
    };


    if (suggestions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Market Suggestions</CardTitle>
                    <CardDescription>Review and approve or deny market suggestions from users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center p-8">There are no pending market suggestions.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Market Suggestions</CardTitle>
                <CardDescription>Review and approve or deny market suggestions from users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Question</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Resolves</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suggestions.map((suggestion) => (
                            <TableRow key={suggestion.id}>
                                <TableCell className="max-w-md">
                                    <p className="font-medium">{suggestion.title}</p>
                                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                                </TableCell>
                                <TableCell className='truncate'><Badge variant="outline">{suggestion.category}</Badge></TableCell>
                                <TableCell className="font-mono text-xs truncate">{suggestion.pi_username}</TableCell>
                                <TableCell className="text-xs truncate">
                                    {suggestion.end_time ? format(new Date(suggestion.end_time), 'P') : 'N/A'}
                                </TableCell>
                                <TableCell className="space-x-2 truncate">
                                    <Button size="sm" onClick={() => handleApproval(suggestion.id, true)}>Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleApproval(suggestion.id, false)}>Deny</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
