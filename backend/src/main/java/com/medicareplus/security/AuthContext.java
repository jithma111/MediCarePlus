package com.medicareplus.security;

import com.medicareplus.exception.ApiException;
import com.medicareplus.model.Role;
import com.medicareplus.model.User;
import com.medicareplus.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Very small token-based session store.
 * Login returns a random bearer token; the front end sends it as "Authorization: Bearer ...".
 * Tokens live in memory, so everyone is logged out when the backend restarts.
 */
@Component
public class AuthContext {

    private final Map<String, Long> tokens = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final UserRepository users;

    public AuthContext(UserRepository users) {
        this.users = users;
    }

    public String issueToken(User user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = HexFormat.of().formatHex(bytes);
        tokens.put(token, user.getId());
        return token;
    }

    public void revoke(HttpServletRequest req) {
        String token = extract(req);
        if (token != null) {
            tokens.remove(token);
        }
    }

    /** The logged-in user, or a 401 error. */
    public User require(HttpServletRequest req) {
        String token = extract(req);
        Long id = token == null ? null : tokens.get(token);
        if (id == null) {
            throw new ApiException(401, "Please log in.");
        }
        return users.findById(id).orElseThrow(() -> new ApiException(401, "Please log in."));
    }

    /** The logged-in user if they have one of the roles, or 401 / 403. */
    public User require(HttpServletRequest req, Role... roles) {
        User user = require(req);
        for (Role r : roles) {
            if (user.getRole() == r) {
                return user;
            }
        }
        throw new ApiException(403, "You do not have permission to do that.");
    }

    private String extract(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        return null;
    }
}
