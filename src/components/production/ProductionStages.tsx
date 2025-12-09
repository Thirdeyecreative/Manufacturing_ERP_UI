import Select from "react-select";
import { Label } from "@/components/ui/label";

function ProductionStages({ formData, setFormData, productionStages }: any) {
  const stageOptions = productionStages.map((stage: any) => ({
    value: stage.id.toString(),
    label: stage.stage_name,
  }));
    
    console.log(stageOptions);
    
    
  return (
    <div>
      <Label>Production Stages</Label>
      <Select
        isMulti
        options={stageOptions}
        value={stageOptions.filter((opt) =>
          formData.productionStages.includes(opt.value)
        )}
        onChange={(selected) =>
          setFormData((prev) => ({
            ...prev,
            productionStages: selected.map((s: any) => s.value),
          }))
        }
        placeholder="Select production stages"
      />
    </div>
  );
}

export default ProductionStages;
