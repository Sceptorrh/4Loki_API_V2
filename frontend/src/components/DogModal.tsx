import DogModal from '@/components/dogs/DogModal';

interface DogModalProps {
  onClose: () => void;
  onDogCreated: (dogId: number, dogName: string) => void;
  customerId: number;
}

export default function DogModalWrapper({ onClose, onDogCreated, customerId }: DogModalProps) {
  return (
    <DogModal
      mode="create"
      customerId={customerId}
      onClose={onClose}
      onDogCreated={onDogCreated}
    />
  );
} 