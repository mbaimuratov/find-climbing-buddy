import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  SkeletonText,
  Button,
  Flex,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { EventData, EventPublic, EventsService } from "../../client";
import ActionsMenu from "../../components/Common/ActionsMenu";

const PER_PAGE = 5;

function getEventsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      EventsService.listEvents({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["events", { page }],
  };
}

function EventsTable({ onRegister, onWithdraw, registeredEvents, userId }: { onRegister: (event: EventData) => void, onWithdraw: (event: EventData) => void, registeredEvents: Set<string>, userId: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isPending, isPlaceholderData } = useQuery({
    ...getEventsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  });

  const events = data?.data || [];
  console.log(events);
  const hasNextPage = !isPlaceholderData && Array.isArray(events) && events.length === PER_PAGE;
  const hasPreviousPage = page > 1;

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getEventsQueryOptions({ page: page + 1 }));
    }
  }, [page, queryClient, hasNextPage]);

  return (
    <>
      <TableContainer>
        <Table size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Description</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          {isPending ? (
            <Tbody>
              <Tr>
                {new Array(4).fill(null).map((_, index) => (
                  <Td key={index}>
                    <SkeletonText noOfLines={1} paddingBlock="16px" />
                  </Td>
                ))}
              </Tr>
            </Tbody>
          ) : (
            <Tbody>
              {Array.isArray(events) ? (
                events.map((event: EventPublic) => (
                  <Tr key={event.id} opacity={isPlaceholderData ? 0.5 : 1}>
                    <Td isTruncated maxWidth="150px">
                      {event.title}
                    </Td>
                    <Td
                      color={!event.description ? "ui.dim" : "inherit"}
                      isTruncated
                      maxWidth="150px"
                    >
                      {event.description || "N/A"}
                    </Td>
                    <Td>{new Date(event.date).toLocaleDateString()}</Td>
                    <Td>
                      {registeredEvents.has(event.id) ? (
                        <Button ml={2} onClick={() => onWithdraw(event)}>Withdraw Registration</Button>
                      ) : (
                        <Button ml={2} onClick={() => onRegister(event)}>Register</Button>
                      )}
                      {event.organizer_id === userId && (
                        <ActionsMenu type={"Event"} value={event} />
                      )}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={4}>No events found</Td>
                </Tr>
              )}
            </Tbody>
          )}
        </Table>
      </TableContainer>
      <Flex
        gap={4}
        alignItems="center"
        mt={4}
        direction="row"
        justifyContent="flex-end"
      >
        <Button onClick={() => setPage(page - 1)} isDisabled={!hasPreviousPage}>
          Previous
        </Button>
        <span>Page {page}</span>
        <Button isDisabled={!hasNextPage} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </Flex>
    </>
  );
}

export default EventsTable;