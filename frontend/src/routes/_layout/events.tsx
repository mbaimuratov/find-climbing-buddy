import {
  Button,
  Container,
  Flex,
  Heading,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

import { EventCreate, EventData, EventsService } from "../../client";
import AddEvent from "../../components/Events/AddEvent";
import RegistrationDialog from "../../components/Events/RegistrationDialog";
import useAuth from "../../hooks/useAuth";
import EventsTable from "../../components/Events/EventsTable";

const eventsSearchSchema = z.object({
  page: z.number().catch(1),
});

export const Route = createFileRoute("/_layout/events")({
  component: Events,
  validateSearch: (search) => eventsSearchSchema.parse(search),
});

function Events() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get the logged-in user's information
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const { isOpen: isRegisterOpen, onOpen: onRegisterOpen, onClose: onRegisterClose } = useDisclosure();
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const toast = useToast();


  useEffect(() => {
    if (user) {
      EventsService.getUserRegisteredEvents()
        .then((response) => {
          setRegisteredEvents(new Set(response.data.map((event: EventData) => event.id)));
        })
        .catch((error) => {
          console.error("Failed to fetch registered events:", error);
        });
    }
  }, [user]);

  const handleAddEvent = (event: EventCreate) => {
    const newEvent: EventData = {
      ...event,
      id: crypto.randomUUID(),
    };
    queryClient.setQueryData(['events'], (oldData: any) => {
      if (!oldData) return [newEvent];
      return [...oldData, newEvent];
    });
  };

  const handleRegisterClick = (event: EventData) => {
    setSelectedEvent(event);
    onRegisterOpen();
  };

  const handleRegisterSubmit = (data: any) => {
    console.log("Registration data:", data);
    EventsService.registerForEvent({ eventId: selectedEvent!.id })
      .then((response) => {
        console.log("Registration successful:", response);
        setRegisteredEvents((prev) => new Set(prev).add(selectedEvent!.id));
        queryClient.invalidateQueries({ queryKey: ["events"] });
        toast({
          title: "Registration successful.",
          description: "You have successfully registered for the event.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .catch((error) => {
        console.error("Registration failed:", error);
        toast({
          title: "Registration failed.",
          description: "There was an error registering for the event.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
    onRegisterClose();
  };

  const handleWithdrawClick = (event: EventData) => {
    EventsService.unregisterForEvent({ eventId: event.id })
      .then((response) => {
        console.log("Withdrawal successful:", response);
        setRegisteredEvents((prev) => {
          const newSet = new Set(prev);
          newSet.delete(event.id);
          return newSet;
        });
        queryClient.invalidateQueries({ queryKey: ["events"] });
        toast({
          title: "Withdrawal successful.",
          description: "You have successfully withdrawn from the event.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .catch((error) => {
        console.error("Withdrawal failed:", error);
        toast({
          title: "Withdrawal failed.",
          description: "There was an error withdrawing from the event.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  };

  

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Events Management
      </Heading>

      <Flex justifyContent="flex-end" mb={4}>
        <Button colorScheme="teal" onClick={onOpen}>
          Add Event
        </Button>
      </Flex>

      <EventsTable onRegister={handleRegisterClick} onWithdraw={handleWithdrawClick} registeredEvents={registeredEvents} userId={user?.id || ""} />

      <AddEvent isOpen={isOpen} onClose={onClose} onAddEvent={handleAddEvent} />

      {selectedEvent && user && (
        <RegistrationDialog
          isOpen={isRegisterOpen}
          onClose={onRegisterClose}
          onSubmit={handleRegisterSubmit}
          user={{
            ...user,
            full_name: user.full_name || "No Name Provided",
          }}
        />
      )}
    </Container>
  );
}

export default Events;