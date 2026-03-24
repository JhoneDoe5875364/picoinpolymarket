import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { FraudReport } from "@/lib/types";
import { Button } from "../ui/button";

const mockFraudData: FraudReport[] = [
    {
        tradeId: "trd-001",
        marketId: "market-001",
        marketQuestion: "Will Bitcoin reach $100,000 by the end of 2024?",
        userId: "user-suspicious",
        amount: 50000,
        side: "yes",
        fraudScore: 0.92,
        reason: "Unusually large trade amount from a new user account with a mismatched IP address location.",
        timestamp: "2024-05-21T14:30:00Z"
    },
    {
        tradeId: "trd-002",
        marketId: "market-003",
        marketQuestion: "Will a manned mission to Mars be announced by a private company this year?",
        userId: "user-botlike",
        amount: 10.1234,
        side: "no",
        fraudScore: 0.78,
        reason: "Rapid sequence of small, precise trades from a user agent associated with scripting bots.",
        timestamp: "2024-05-20T11:05:00Z"
    },
];

export function FraudReport() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Suspicious Trade Report</CardTitle>
                <CardDescription>Trades flagged by the AI fraud detection system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fraud Score</TableHead>
                            <TableHead>Market</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockFraudData.map((report) => (
                            <TableRow key={report.tradeId} className="hover:bg-destructive/10">
                                <TableCell>
                                    <Badge variant="destructive" className="text-lg">
                                        {(report.fraudScore * 100).toFixed(0)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">{report.marketQuestion}</TableCell>
                                <TableCell className="font-mono">{report.userId}</TableCell>
                                <TableCell>{report.amount} π</TableCell>
                                <TableCell className="max-w-sm text-muted-foreground">{report.reason}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm">Block User</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
