// This is a conceptual example of how you might implement the backend logic in Java using Spring Boot and a WebSocket library like netty-socketio.

// First, you would need a data model class for the friend verification request.
// FriendVerify.java
public class FriendVerify {
    private String senderId;
    private String receiverId;
    private String applyReason;
    private String remark;
    private int status;
    private int hasRead;
    private String createTime;
    // getters and setters
}

// Next, you would have a WebSocket event handler to listen for the 'sendVerify' event.
// This example uses the 'netty-socketio' library.

// SocketEventHandler.java
import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SocketEventHandler {

    @Autowired
    private SocketIOServer server;

    @Autowired
    private FriendVerifyService friendVerifyService; // A service to handle business logic

    // This method listens for the 'sendVerify' event from the client.
    @OnEvent("sendVerify")
    public void onSendVerify(SocketIOClient client, AckRequest ackRequest, FriendVerify data) {
        System.out.println("Received friend request: " + data);

        try {
            // 1. Save the friend request to the database.
            FriendVerify savedRequest = friendVerifyService.saveFriendRequest(data);

            // 2. Find the recipient's client connection to send a real-time notification.
            // This requires a way to map user IDs to SocketIOClients, often done via a Map on connection.
            SocketIOClient receiverClient = findClientByUserId(savedRequest.getReceiverId());
            if (receiverClient != null) {
                // Send a notification to the receiver.
                receiverClient.sendEvent("newFriendRequest", savedRequest);
            }

            // 3. Send a success response back to the sender.
            // The 'response' object in the frontend corresponds to this ack.
            if (ackRequest.isAckRequested()) {
                ackRequest.sendAckData(savedRequest); // Send back the saved data
            }

        } catch (Exception e) {
            // Handle errors, e.g., database error.
            System.err.println("Failed to process friend request: " + e.getMessage());
            if (ackRequest.isAckRequested()) {
                // Send back null or an error object to indicate failure.
                ackRequest.sendAckData(null);
            }
        }
    }

    // A helper method to find a connected client by their user ID.
    // This is a simplified example. In a real application, you would need a robust way
    // to manage user sessions and their corresponding socket connections.
    private SocketIOClient findClientByUserId(String userId) {
        // You would typically maintain a map of userId -> SocketIOClient
        // For example: private Map<String, SocketIOClient> userClients = new ConcurrentHashMap<>();
        // On connect, you would add the client to the map. On disconnect, you'd remove it.
        for (SocketIOClient client : server.getAllClients()) {
            // Assuming you store the userId as a parameter on the client during connection handshake.
            String connectedUserId = client.getHandshakeData().getUrlParams().get("userId").get(0);
            if (userId.equals(connectedUserId)) {
                return client;
            }
        }
        return null;
    }
}

// Finally, a service layer to handle the business logic, like saving to a database.
// FriendVerifyService.java
import org.springframework.stereotype.Service;

@Service
public class FriendVerifyService {
    // @Autowired
    // private FriendVerifyRepository friendVerifyRepository; // Assuming you use Spring Data JPA

    public FriendVerify saveFriendRequest(FriendVerify request) {
        // Here you would implement the logic to save the request to your database.
        // For example: return friendVerifyRepository.save(request);
        System.out.println("Saving friend request for receiver: " + request.getReceiverId());
        // This is a mock response. In a real app, the saved entity would be returned.
        return request;
    }
}
