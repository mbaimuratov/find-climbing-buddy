import { Button, FormControl, FormLabel, Input, Textarea, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormErrorMessage } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { EventsService, type EventCreate, type ApiError } from '../../client';
import useCustomToast from '../../hooks/useCustomToast';
import { handleError } from '../../utils';

interface AddEventProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: EventCreate) => void;
}

const AddEvent: React.FC<AddEventProps> = ({ isOpen, onClose, onAddEvent }) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventCreate>({
    mode: 'onBlur',
    criteriaMode: 'all',
    defaultValues: {
      title: '',
      description: '',
      date: '',
      location: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EventCreate) => EventsService.createEvent({ requestBody: data }),
    onSuccess: (data) => {
      showToast('Success!', 'Event created successfully.', 'success');
      onAddEvent(data);
      reset();
      onClose();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const onSubmit: SubmitHandler<EventCreate> = (data) => {
    mutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>Add Event</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4} isRequired isInvalid={!!errors.title}>
            <FormLabel htmlFor="title">Event Title</FormLabel>
            <Input
              id="title"
              {...register('title', {
                required: 'Title is required.',
              })}
              placeholder="Enter event title"
            />
            {errors.title && <FormErrorMessage>{errors.title.message}</FormErrorMessage>}
          </FormControl>
          <FormControl mb={4} isInvalid={!!errors.description}>
            <FormLabel htmlFor="description">Event Description</FormLabel>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter event description"
            />
            {errors.description && <FormErrorMessage>{errors.description.message}</FormErrorMessage>}
          </FormControl>
          <FormControl mb={4} isRequired isInvalid={!!errors.date}>
            <FormLabel htmlFor="date">Event Date</FormLabel>
            <Input
              id="date"
              type="datetime-local"
              {...register('date', {
                required: 'Date is required.',
              })}
              placeholder="Enter event date"
            />
            {errors.date && <FormErrorMessage>{errors.date.message}</FormErrorMessage>}
          </FormControl>
          <FormControl mb={4} isRequired isInvalid={!!errors.location}>
            <FormLabel htmlFor="location">Event Location</FormLabel>
            <Input
              id="location"
              {...register('location', {
                required: 'Location is required.',
              })}
              placeholder="Enter event location"
            />
            {errors.location && <FormErrorMessage>{errors.location.message}</FormErrorMessage>}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="teal" type="submit" isLoading={isSubmitting}>
            Add Event
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddEvent;