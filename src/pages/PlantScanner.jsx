import CameraPlantScanner, { plantDictionary } from '@/components/CameraPlantScanner';

export { plantDictionary };

export default function PlantScanner() {
  return (
    <div className="min-h-full pb-8 bg-slate-950">
      <CameraPlantScanner standalone={true} />
    </div>
  );
}