package <%= packageName %>.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for <%= engineName %> templates.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class <%= engineName %>TemplateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void shouldLoadLoginPage() throws Exception {
        mockMvc.perform(get("/login"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(containsString("Login")))
                .andExpect(content().string(containsString("Password")))
                .andExpect(content().string(containsString("Sign In")));
    }

    @Test
    public void shouldRedirectUnauthenticatedUserToLogin() throws Exception {
        mockMvc.perform(get("/dashboard"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrlPattern("**/login"));
    }

    @Test
    @WithMockUser
    public void shouldLoadDashboardForAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/dashboard"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(containsString("Dashboard")))
                .andExpect(content().string(containsString("Welcome")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void shouldLoadAdminPageForAdminUser() throws Exception {
        mockMvc.perform(get("/admin"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(containsString("Admin Dashboard")));
    }

    @Test
    @WithMockUser(roles = "USER")
    public void shouldForbidNonAdminUserFromAccessingAdminPage() throws Exception {
        mockMvc.perform(get("/admin"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void shouldLoadErrorPage() throws Exception {
        mockMvc.perform(get("/error"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(containsString("Error")));
    }

    @Test
    public void shouldHandleNotFoundPage() throws Exception {
        mockMvc.perform(get("/page-that-does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("404")));
    }
}
