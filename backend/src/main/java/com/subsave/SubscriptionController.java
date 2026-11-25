package com.subsave;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.subsave.AccountController.SESSION_COOKIE;
import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

@RestController
@RequestMapping("/api/subscriptions")
class SubscriptionController {
    private static final String EXPECTED_ACCOUNT = "X-SubSave-Account";
    private final AccountStore accounts;
    private final SubscriptionStore subscriptions;

    SubscriptionController(AccountStore accounts, SubscriptionStore subscriptions) {
        this.accounts = accounts;
        this.subscriptions = subscriptions;
    }

    record SubscriptionList(List<SubscriptionStore.Subscription> subscriptions) {}
    record SubscriptionResponse(SubscriptionStore.Subscription subscription) {}

    @GetMapping
    SubscriptionList list(@CookieValue(name = SESSION_COOKIE, required = false) String token,
                          @RequestHeader(name = EXPECTED_ACCOUNT, required = false) String expectedAccount) {
        return new SubscriptionList(subscriptions.list(requireAccount(token, expectedAccount)));
    }

    @PostMapping(consumes = APPLICATION_JSON_VALUE)
    ResponseEntity<SubscriptionResponse> add(@CookieValue(name = SESSION_COOKIE, required = false) String token,
                                             @RequestHeader(name = EXPECTED_ACCOUNT, required = false) String expectedAccount,
                                             @RequestBody Map<String, Object> input) {
        String owner = requireAccount(token, expectedAccount);
        var subscription = subscriptions.add(owner, SubscriptionDetails.read(input));
        return ResponseEntity.status(201).body(new SubscriptionResponse(subscription));
    }

    @PutMapping(path = "/{id}", consumes = APPLICATION_JSON_VALUE)
    SubscriptionResponse edit(@CookieValue(name = SESSION_COOKIE, required = false) String token,
                              @RequestHeader(name = EXPECTED_ACCOUNT, required = false) String expectedAccount,
                              @PathVariable String id, @RequestBody Map<String, Object> input) {
        String owner = requireAccount(token, expectedAccount);
        return new SubscriptionResponse(subscriptions.edit(owner, id, SubscriptionDetails.read(input)));
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@CookieValue(name = SESSION_COOKIE, required = false) String token,
                                @RequestHeader(name = EXPECTED_ACCOUNT, required = false) String expectedAccount,
                                @PathVariable String id) {
        subscriptions.delete(requireAccount(token, expectedAccount), id);
        return ResponseEntity.noContent().build();
    }

    private String requireAccount(String token, String expectedAccount) {
        var user = accounts.currentAccount(token);
        if (user == null || (expectedAccount != null && !expectedAccount.equals(user.id()))) {
            throw ApiError.changedSession();
        }
        return user.id();
    }
}
