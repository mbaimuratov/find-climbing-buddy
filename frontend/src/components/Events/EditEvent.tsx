import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
    type ApiError,
    EventCreate,
    type EventPublic,
    EventsService,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

interface EditEventProps {
    event: EventPublic
    isOpen: boolean
    onClose: () => void
}

const EditEvent = ({ event, isOpen, onClose }: EditEventProps) => {
    const queryClient = useQueryClient()
    const showToast = useCustomToast()
    const {
        register,
        handleSubmit,
        reset,
        formState: { isSubmitting, errors, isDirty },
    } = useForm<EventCreate>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: event,
    })

    const mutation = useMutation({
        mutationFn: (data: EventCreate) =>
            EventsService.updateEvent({ id: event.id, requestBody: data }),
        onSuccess: () => {
            showToast("Success!", "Event updated successfully.", "success")
            onClose()
        },
        onError: (err: ApiError) => {
            handleError(err, showToast)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["events"] })
        },
    })

    const onSubmit: SubmitHandler<EventCreate> = (data) => {
        mutation.mutate(data)
    }

    const onCancel = () => {
        reset()
        onClose()
    }

    console.log(event)

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                size={{ base: "sm", md: "md" }}
                isCentered
            >
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
                    <ModalHeader>Edit Event</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <FormControl isInvalid={!!errors.title}>
                            <FormLabel htmlFor="title">Title</FormLabel>
                            <Input
                                id="title"
                                {...register("title", {
                                    required: "Title is required",
                                })}
                                type="text"
                            />
                            {errors.title && (
                                <FormErrorMessage>{errors.title.message}</FormErrorMessage>
                            )}
                        </FormControl>
                        <FormControl mt={4}>
                            <FormLabel htmlFor="description">Description</FormLabel>
                            <Input
                                id="description"
                                {...register("description")}
                                placeholder="Description"
                                type="text"
                            />
                        </FormControl>
                        <FormControl mt={4}>
                            <FormLabel htmlFor="location">Location</FormLabel>
                            <Input
                                id="location"
                                {...register("location")}
                                placeholder="Location"
                                type="text"
                            />
                        </FormControl>
                        <FormControl mt={4}>
                            <FormLabel htmlFor="date">Date</FormLabel>
                            <Input
                                id="date"
                                type="datetime-local"
                                {...register("date", {
                                    required: "Date is required",
                                })}
                            />
                            {errors.date && (
                                <FormErrorMessage>{errors.date.message}</FormErrorMessage>
                            )}
                        </FormControl>
                    </ModalBody>
                    <ModalFooter gap={3}>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={isSubmitting}
                            isDisabled={!isDirty}
                        >
                            Save
                        </Button>
                        <Button onClick={onCancel}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}

export default EditEvent