// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { useAuth } from "@/lib/auth";
// import { Button } from "@/components/ui/button";
// import {
//     Form,
//     FormControl,
//     FormField,
//     FormItem,
//     FormLabel,
//     FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardFooter,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import { Link } from "react-router-dom";

// const signupSchema = z
//     .object({
//         name: z.string().min(2, "Name must be at least 2 characters"),
//         email: z.string().email("Invalid email address"),
//         password: z.string().min(8, "Password must be at least 8 characters"),
//         confirmPassword: z
//             .string()
//             .min(8, "Password must be at least 8 characters"),
//     })
//     .refine((data) => data.password === data.confirmPassword, {
//         message: "Passwords don't match",
//         path: ["confirmPassword"],
//     });

// type SignupFormValues = z.infer<typeof signupSchema>;

// export function SignupForm() {
//     const { signup } = useAuth();
//     const form = useForm<SignupFormValues>({
//         resolver: zodResolver(signupSchema),
//         defaultValues: {
//             name: "",
//             email: "",
//             password: "",
//             confirmPassword: "",
//         },
//     });

//     const onSubmit = async (data: SignupFormValues) => {
//         try {
//             await signup(data.name, data.email, data.password);
//         } catch (error) {
//             // Error is handled by the auth context
//         }
//     };

//     return (
//         <Card className="w-[350px]">
//             <CardHeader>
//                 <CardTitle>Sign Up</CardTitle>
//                 <CardDescription>
//                     Create a new account to get started
//                 </CardDescription>
//             </CardHeader>
//             <Form {...form}>
//                 <form onSubmit={form.handleSubmit(onSubmit)}>
//                     <CardContent className="space-y-4">
//                         <FormField
//                             control={form.control}
//                             name="name"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Name</FormLabel>
//                                     <FormControl>
//                                         <Input
//                                             placeholder="Enter your name"
//                                             {...field}
//                                         />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                         />
//                         <FormField
//                             control={form.control}
//                             name="email"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Email</FormLabel>
//                                     <FormControl>
//                                         <Input
//                                             placeholder="Enter your email"
//                                             {...field}
//                                         />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                         />
//                         <FormField
//                             control={form.control}
//                             name="password"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Password</FormLabel>
//                                     <FormControl>
//                                         <Input
//                                             type="password"
//                                             placeholder="Enter your password"
//                                             {...field}
//                                         />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                         />
//                         <FormField
//                             control={form.control}
//                             name="confirmPassword"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Confirm Password</FormLabel>
//                                     <FormControl>
//                                         <Input
//                                             type="password"
//                                             placeholder="Confirm your password"
//                                             {...field}
//                                         />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                         />
//                     </CardContent>
//                     <CardFooter className="flex flex-col space-y-4">
//                         <Button
//                             type="submit"
//                             className="w-full"
//                             disabled={form.formState.isSubmitting}
//                         >
//                             {form.formState.isSubmitting
//                                 ? "Creating account..."
//                                 : "Sign Up"}
//                         </Button>
//                         <p className="text-sm text-center text-gray-500">
//                             Already have an account?{" "}
//                             <Link
//                                 to="/login"
//                                 className="text-primary hover:underline"
//                             >
//                                 Login
//                             </Link>
//                         </p>
//                     </CardFooter>
//                 </form>
//             </Form>
//         </Card>
//     );
// }
