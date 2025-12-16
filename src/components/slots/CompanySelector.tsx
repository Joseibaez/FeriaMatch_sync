import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CompanySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface RegisteredCompany {
  id: string;
  company_name: string | null;
  email: string;
}

export function CompanySelector({
  value,
  onChange,
  placeholder = "Seleccionar o escribir empresa...",
}: CompanySelectorProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Fetch registered companies (recruiters with company_name)
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["registered-companies"],
    queryFn: async () => {
      // Get all recruiter user_ids
      const { data: recruiterRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "recruiter");

      if (rolesError) throw rolesError;

      if (!recruiterRoles || recruiterRoles.length === 0) return [];

      const userIds = recruiterRoles.map((r) => r.user_id);

      // Get profiles for those recruiters
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, company_name, email")
        .in("id", userIds)
        .not("company_name", "is", null);

      if (profilesError) throw profilesError;

      return (profiles || []) as RegisteredCompany[];
    },
  });

  // Filter companies based on input
  const filteredCompanies = useMemo(() => {
    if (!inputValue) return companies;
    const searchTerm = inputValue.toLowerCase();
    return companies.filter(
      (company) =>
        company.company_name?.toLowerCase().includes(searchTerm) ||
        company.email.toLowerCase().includes(searchTerm)
    );
  }, [companies, inputValue]);

  // Check if the current input matches a registered company
  const isCustomValue = useMemo(() => {
    if (!value) return false;
    return !companies.some(
      (c) => c.company_name?.toLowerCase() === value.toLowerCase()
    );
  }, [value, companies]);

  const handleSelect = (companyName: string) => {
    onChange(companyName);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    // Allow typing a custom value
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            {value ? (
              <>
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{value}</span>
                {isCustomValue && (
                  <span className="text-xs text-muted-foreground">(manual)</span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar o escribir nombre..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Cargando empresas...
              </div>
            ) : (
              <>
                {/* Show custom entry option if typing something not in list */}
                {inputValue && !companies.some(
                  (c) => c.company_name?.toLowerCase() === inputValue.toLowerCase()
                ) && (
                  <CommandGroup heading="Entrada manual">
                    <CommandItem
                      value={`custom-${inputValue}`}
                      onSelect={() => handleSelect(inputValue)}
                      className="flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Usar: "{inputValue}"</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        (no registrada)
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}

                {filteredCompanies.length > 0 ? (
                  <CommandGroup heading="Empresas Registradas">
                    {filteredCompanies.map((company) => (
                      <CommandItem
                        key={company.id}
                        value={company.company_name || ""}
                        onSelect={() => handleSelect(company.company_name || "")}
                        className="flex items-center gap-2"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === company.company_name
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{company.company_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {company.email}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  !inputValue && (
                    <CommandEmpty>
                      No hay empresas registradas. Escribe un nombre.
                    </CommandEmpty>
                  )
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
