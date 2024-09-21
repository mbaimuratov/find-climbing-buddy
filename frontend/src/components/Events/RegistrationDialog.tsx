import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";

interface RegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    full_name: string;
    email: string;
  };
  onSubmit: (data: any) => void;
}

const RegistrationDialog = ({ isOpen, onClose, user, onSubmit }: RegistrationDialogProps) => {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: user.full_name,
      email: user.email,
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Register for Event</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input {...register("name", { required: true })}  />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Email</FormLabel>
            <Input {...register("email", { required: true })}  />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          >
            Register
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RegistrationDialog;