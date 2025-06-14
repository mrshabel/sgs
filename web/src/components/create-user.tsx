import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export default function CreateUserDialog({
    open,
    setOpen,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
}) {
    const [userData, setUserData] = useState({
        username: "",
        fullName: "",
        password: "",
    });

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.register(userData);
            toast.success("User created successfully!");
            setOpen(false);
            setUserData({
                username: "",
                fullName: "",
                password: "",
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to create user";
            toast.error(errorMessage);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Create New User
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Add a new user to your SGS instance.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            value={userData.fullName}
                            onChange={(e) =>
                                setUserData({
                                    ...userData,
                                    fullName: e.target.value,
                                })
                            }
                            className="bg-background/50 border-border/50 focus:border-primary/30 focus:ring-primary/20"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            value={userData.username}
                            onChange={(e) =>
                                setUserData({
                                    ...userData,
                                    username: e.target.value,
                                })
                            }
                            className="bg-background/50 border-border/50 focus:border-primary/30 focus:ring-primary/20"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={userData.password}
                            onChange={(e) =>
                                setUserData({
                                    ...userData,
                                    password: e.target.value,
                                })
                            }
                            className="bg-background/50 border-border/50 focus:border-primary/30 focus:ring-primary/20"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-primary to-primary/90"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create User
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
